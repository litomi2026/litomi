import { roomChannel, roomIdFromChannel } from '@litomi/kv/channels'
import { subscriberClient } from '@litomi/kv/pubsub'
import type { Server, ServerWebSocket } from 'bun'

import { localTopic, MAX_ROOMS_PER_SOCKET, type SocketData } from './protocol'

// RoomRegistry가 필요로 하는 Valkey Pub/Sub 기능만 정의
export interface RoomSubscriber {
  subscribe(channel: string): Promise<unknown>
  unsubscribe(channel: string): Promise<unknown>
  on(event: 'message', listener: (channel: string, message: string) => void): unknown
}

// 여러 노드에 걸친 Valkey Pub/Sub과 Bun의 프로세스 내부 토픽 Pub/Sub을 연결(Bridge)합니다.
//
// 레플리카(Replica)는 로컬에 연결된 소켓이 하나라도 있는 방(참조 카운트 기반)에 대해
// 정확히 단 하나의 Valkey 구독만 유지합니다. 따라서 전체 시스템의 방 개수가 아닌
// 노드당 활성화된 방 개수에 비례하여 스케일링(fan-in)됩니다.
//
// 동시성 모델(CONCURRENCY MODEL) — subscribe/unsubscribe 수정 전 필독:
//   Bun의 WebSocket 메시지 핸들러는 비동기(async)이므로 호출들이 `await`마다 교차(interleave)될 수 있습니다.
//   안정성은 다음 두 가지 규칙에 기반합니다:
//   (1) `counts`의 참조 카운트(refcount)는 오직 동기적(SYNCHRONOUSLY)으로만 변경됩니다 (읽기와 쓰기 사이에 `await` 없음).
//       따라서 교차 실행이 정수값을 손상시킬 수 없습니다. 이 임계 영역(critical section) 내에 절대 `await`를 넣지 마세요.
//   (2) 비동기이고 실패할 수 있는 부분 — 실제 Valkey subscribe/unsubscribe — 은 `reconcile`에 의해 주도됩니다.
//       이 `reconcile`은 방(room)별로 직렬화(SERIALIZES)되며 항상 Valkey가 현재 목표 상태(`count > 0`)를 향하도록 만듭니다.
//       이는 멱등성(idempotent)을 가지며 자가 치유(self-healing)가 가능합니다: 작업이 실패해도 추적된 실제 상태는 그대로 남아
//       다음 reconcile이 재시도할 수 있게 합니다. 이는 미묘한 명령 순서 가정에 의존하기보다, 구조적으로 안전한 연결(bridge)을 보장합니다.
export class RoomRegistry {
  // 목표 상태: 방별 로컬 소켓의 수 (구독됨 ⇔ count > 0).
  private readonly counts = new Map<string, number>()
  // 실제 상태: 공유된 Valkey 연결에서 현재 구독 중인 방들.
  private readonly subscribed = new Set<string>()
  // 특정 방에 대한 Valkey 작업이 겹치거나 순서가 뒤바뀌지 않도록 reconcile을 직렬화하는 방별 Promise 체인.
  private readonly chains = new Map<string, Promise<void>>()

  private server: Server<SocketData> | null = null

  constructor(private readonly subscriber: RoomSubscriber = subscriberClient) {}

  start(server: Server<SocketData>): void {
    this.server = server

    this.subscriber.on('message', (channel, message) => {
      const roomId = roomIdFromChannel(channel)
      if (roomId === null) {
        return
      }

      // JSON 객체/배열이 아닌 모든 것은 버립니다 — 단일 신뢰할 수 있는 퍼블리셔는 절대 그런 메시지를 내보내지 않으며,
      // 그것을 그대로 중계하면 모든 클라이언트의 스트림 파싱을 망가뜨릴 수 있습니다.
      if (!isJSONContainer(message)) {
        console.error('chat relay: dropping non-JSON message', { channel, preview: message.slice(0, 64) })
        return
      }

      // 핫 릴레이 경로(Hot relay path): 워커(worker)는 이미 직렬화된 JSON 객체를 본문으로 퍼블리시하므로,
      // 메시지마다 파싱 후 다시 문자열화하는 대신 원본 직렬화된 JSON을 그대로 이어 붙입니다.
      this.server?.publish(localTopic(roomId), `{"t":"msg","room":${JSON.stringify(roomId)},"data":${message}}`)
    })
  }

  async subscribe(ws: ServerWebSocket<SocketData>, roomId: string): Promise<void> {
    if (ws.data.rooms.has(roomId)) {
      return
    }

    if (ws.data.rooms.size >= MAX_ROOMS_PER_SOCKET) {
      throw new Error('Room limit exceeded')
    }

    // 동기적 임계 영역(Synchronous critical section): 로컬 멤버십을 확보하고 참조 카운트를 올립니다.
    ws.subscribe(localTopic(roomId))
    ws.data.rooms.add(roomId)
    this.counts.set(roomId, (this.counts.get(roomId) ?? 0) + 1)

    try {
      await this.reconcile(roomId)
    } catch (error) {
      // 이 소켓의 contribution을 되돌린 다음
      this.releaseLocal(ws, roomId)
      // 그 사이에 다른 로컬 소켓이 들어왔을 수 있어 현재 필요로 하는 상태로 Valkey가 맞춰지도록 reconcile을 다시 실행합니다.
      await this.reconcile(roomId).catch(() => undefined)
      // 클라이언트에게 실패를 보고하고 재시도할 수 있도록 오류를 다시 던집니다.
      throw error
    }
  }

  async unsubscribe(ws: ServerWebSocket<SocketData>, roomId: string): Promise<void> {
    if (!this.releaseLocal(ws, roomId)) {
      return
    }

    await this.reconcile(roomId).catch((error) => {
      // 실패한 Valkey 구독 해제는 이후의 reconcile (또는 ioredis의 재연결 시 재구독)에 의해 재시도되므로,
      // 일시적인 실패가 소켓이 닫힐 때 교착 상태(wedge)를 만들지 않습니다.
      console.error('room unsubscribe reconcile failed:', { roomId, error })
    })
  }

  async unsubscribeAll(ws: ServerWebSocket<SocketData>): Promise<void> {
    // 한 방의 실패가 나머지 방들의 정리 작업을 중단시키지 않도록 allSettled를 사용합니다.
    await Promise.allSettled([...ws.data.rooms].map((roomId) => this.unsubscribe(ws, roomId)))
  }

  // 소켓의 로컬 멤버십을 제거하고 참조 카운트를 줄입니다. 소켓이 방에 없었다면 false를 반환합니다. (동기 작업)
  private releaseLocal(ws: ServerWebSocket<SocketData>, roomId: string): boolean {
    if (!ws.data.rooms.delete(roomId)) {
      return false
    }

    ws.unsubscribe(localTopic(roomId))

    const next = (this.counts.get(roomId) ?? 0) - 1

    if (next > 0) {
      this.counts.set(roomId, next)
    } else {
      this.counts.delete(roomId)
    }

    return true
  }

  // 방별로 직렬화하여 Valkey 구독을 목표 상태로 이끕니다.
  // 반환된 Promise는 이미 큐에 대기 중인 모든 reconcile을 포함하여 이 방의 보류 중인 작업이 완료될 때 해결(settle)됩니다.
  private reconcile(roomId: string): Promise<void> {
    const prev = this.chains.get(roomId) ?? Promise.resolve()
    const next = prev.catch(() => undefined).then(() => this.applyDesired(roomId))

    this.chains.set(roomId, next)

    // 작업이 다 끝나면 대기열에서 스스로를 삭제하되(다른 작업이 안 덮어썼을 때만), 그 과정에서 오류 경고창이 뜨지 않게 조용히 처리
    void next
      .catch(() => undefined)
      .finally(() => {
        if (this.chains.get(roomId) === next) {
          this.chains.delete(roomId)
        }
      })

    return next
  }

  private async applyDesired(roomId: string): Promise<void> {
    const desired = (this.counts.get(roomId) ?? 0) > 0
    const actual = this.subscribed.has(roomId)

    if (desired === actual) {
      return
    }

    if (desired) {
      await this.subscriber.subscribe(roomChannel(roomId))
      this.subscribed.add(roomId)
    } else {
      await this.subscriber.unsubscribe(roomChannel(roomId))
      this.subscribed.delete(roomId)
    }
  }
}

// 전체 구문 분석(parse) 비용을 치르지 않고도, 메시지를 망가뜨릴 수 있는 거짓 JSON 페이로드를 거부합니다.
function isJSONContainer(message: string): boolean {
  const first = message.charCodeAt(0)
  return first === 0x7b /* { */ || first === 0x5b /* [ */
}
