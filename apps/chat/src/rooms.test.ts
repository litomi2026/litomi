import { describe, expect, test } from 'bun:test'
import { roomChannel } from '@litomi/kv/channels'
import type { Server, ServerWebSocket } from 'bun'

import { encode, localTopic, type SocketData } from './protocol'
import { RoomRegistry, type RoomSubscriber } from './rooms'

class FakeSubscriber implements RoomSubscriber {
  readonly subscribeCalls: string[] = []
  readonly unsubscribeCalls: string[] = []
  messageHandler: ((channel: string, message: string) => void) | null = null
  subscribeImpl: (channel: string) => Promise<unknown> = async () => 1
  unsubscribeImpl: (channel: string) => Promise<unknown> = async () => 1

  subscribe(channel: string): Promise<unknown> {
    this.subscribeCalls.push(channel)
    return this.subscribeImpl(channel)
  }

  unsubscribe(channel: string): Promise<unknown> {
    this.unsubscribeCalls.push(channel)
    return this.unsubscribeImpl(channel)
  }

  on(_event: 'message', listener: (channel: string, message: string) => void): unknown {
    this.messageHandler = listener
    return this
  }
}

function makeSocket(userId = 1): ServerWebSocket<SocketData> {
  return {
    data: { userId, rooms: new Set<string>(), msgCount: 0, msgResetAt: 0 } satisfies SocketData,
    subscribe: () => {},
    unsubscribe: () => {},
  } as unknown as ServerWebSocket<SocketData>
}

describe('RoomRegistry refcount', () => {
  test('첫 구독자만 Valkey를 SUBSCRIBE하고 마지막 해제자만 UNSUBSCRIBE한다', async () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const a = makeSocket(1)
    const b = makeSocket(2)

    await reg.subscribe(a, 'r1')
    await reg.subscribe(b, 'r1')
    expect(sub.subscribeCalls).toEqual([roomChannel('r1')]) // 두 번째 로컬 구독은 Valkey 호출 없음

    await reg.unsubscribe(a, 'r1')
    expect(sub.unsubscribeCalls).toEqual([]) // b가 아직 있으므로 유지

    await reg.unsubscribe(b, 'r1')
    expect(sub.unsubscribeCalls).toEqual([roomChannel('r1')])
  })

  test('같은 소켓의 중복 구독/해제는 멱등이다', async () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const a = makeSocket()

    await reg.subscribe(a, 'r1')
    await reg.subscribe(a, 'r1')
    expect(a.data.rooms.size).toBe(1)
    expect(sub.subscribeCalls).toEqual([roomChannel('r1')])

    await reg.unsubscribe(a, 'r1')
    await reg.unsubscribe(a, 'r1') // 이미 빠진 소켓 — 무시
    expect(sub.unsubscribeCalls).toEqual([roomChannel('r1')])
  })

  test('소켓당 룸 한도를 초과하면 throw한다', async () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const a = makeSocket()

    for (let i = 0; i < 100; i++) {
      await reg.subscribe(a, `r${i}`)
    }

    expect(reg.subscribe(a, 'overflow')).rejects.toThrow('Room limit exceeded')
    expect(a.data.rooms.has('overflow')).toBe(false)
  })

  test('unsubscribeAll은 모든 룸의 Valkey 구독을 해제한다', async () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const a = makeSocket()

    await reg.subscribe(a, 'r1')
    await reg.subscribe(a, 'r2')
    await reg.unsubscribeAll(a)

    expect(a.data.rooms.size).toBe(0)
    expect([...sub.unsubscribeCalls].sort()).toEqual([roomChannel('r1'), roomChannel('r2')].sort())
  })
})

describe('RoomRegistry 실패 처리', () => {
  test('Valkey 구독 실패 시 소켓 상태를 롤백하고 재throw하며 wedge되지 않는다', async () => {
    const sub = new FakeSubscriber()
    sub.subscribeImpl = async () => {
      throw new Error('valkey down')
    }
    const reg = new RoomRegistry(sub)
    const a = makeSocket()

    await expect(reg.subscribe(a, 'r1')).rejects.toThrow('valkey down')
    expect(a.data.rooms.has('r1')).toBe(false) // 롤백됨

    // 복구 후 재시도하면 "첫 구독자"로서 다시 SUBSCRIBE를 시도한다(카운트가 새지 않음).
    sub.subscribeImpl = async () => 1
    await reg.subscribe(a, 'r1')
    expect(a.data.rooms.has('r1')).toBe(true)
    expect(sub.subscribeCalls).toEqual([roomChannel('r1'), roomChannel('r1')])
  })

  test('동시 구독 중 첫 시도가 실패해도 다른 소켓의 구독은 self-heal된다', async () => {
    const sub = new FakeSubscriber()
    let attempt = 0
    sub.subscribeImpl = async () => {
      attempt += 1
      if (attempt === 1) {
        throw new Error('transient')
      }
      return 1
    }
    const reg = new RoomRegistry(sub)
    const a = makeSocket(1)
    const b = makeSocket(2)

    // 같은 새 룸에 동시 진입: count 0→1(A, owner) →2(B, piggyback)가 동기적으로 일어나고
    // 두 reconcile이 같은 per-room 체인에 직렬화된다.
    const pa = reg.subscribe(a, 'r1')
    const pb = reg.subscribe(b, 'r1')

    await expect(pa).rejects.toThrow('transient') // A의 시도는 실패 → A 롤백
    await pb // B는 직렬화된 재시도로 치유되어 성공

    expect(a.data.rooms.has('r1')).toBe(false)
    expect(b.data.rooms.has('r1')).toBe(true)
    expect(sub.subscribeCalls).toEqual([roomChannel('r1'), roomChannel('r1')]) // 실패 + 재시도
    expect(sub.unsubscribeCalls).toEqual([]) // 최종 구독 상태 — 불필요한 해제 없음
  })
})

describe('RoomRegistry 메시지 중계', () => {
  test('Valkey 메시지를 해당 룸의 로컬 토픽으로 중계하고 외부 채널은 무시한다', () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const published: Array<{ topic: string; data: unknown }> = []
    const server = {
      publish: (topic: string, data: string) => {
        published.push({ topic, data })
      },
    } as unknown as Server<SocketData>

    reg.start(server)
    expect(sub.messageHandler).not.toBeNull()

    // 본문은 이미 직렬화된 JSON이므로 그대로 봉투에 끼워 넣는다. 결과 문자열은
    // 순수 `encode(...)`와 바이트 단위로 동일해야 한다(키 순서 t→room→data 일치).
    const body = JSON.stringify({ messageId: 'm1', content: { text: 'hi "there"' } })
    sub.messageHandler?.(roomChannel('r1'), body)
    expect(published).toEqual([
      {
        topic: localTopic('r1'),
        data: encode({ t: 'msg', room: 'r1', data: { messageId: 'm1', content: { text: 'hi "there"' } } }),
      },
    ])

    published.length = 0
    sub.messageHandler?.('some:other:channel', body) // 외부 채널 — 무시
    expect(published).toEqual([])
  })

  test('비-JSON 본문은 클라이언트 스트림을 깨뜨리지 않도록 드롭한다', () => {
    const sub = new FakeSubscriber()
    const reg = new RoomRegistry(sub)
    const published: string[] = []
    const server = {
      publish: (_topic: string, data: string) => {
        published.push(data)
      },
    } as unknown as Server<SocketData>

    reg.start(server)

    sub.messageHandler?.(roomChannel('r1'), 'plain text') // 객체/배열 아님
    sub.messageHandler?.(roomChannel('r1'), '') // 빈 문자열
    expect(published).toEqual([])

    // 유효한 본문은 정상 중계된다.
    sub.messageHandler?.(roomChannel('r1'), '{"ok":true}')
    expect(published).toEqual(['{"t":"msg","room":"r1","data":{"ok":true}}'])
  })
})
