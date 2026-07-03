import { ENTITLEMENT_CHANNEL, type EntitlementRevokedEvent } from '@litomi/kv/channels'
import { subscriberClient } from '@litomi/kv/pubsub'
import type { ServerWebSocket } from 'bun'

import { canAccessStream, invalidateAccessCache } from './entitlements'
import { encode, type SocketData } from './protocol'
import type { RoomRegistry } from './rooms'

const SWEEP_INTERVAL_MS = 5 * 60_000

// 자격 상실 강퇴 — 방 멤버십은 sub 시점에만 검증되므로, 그 뒤 자격이 사라진 소켓을 두 경로로 정리합니다:
//   - 즉시 경로: api가 환불 시 ENTITLEMENT_CHANNEL로 흘리는 이벤트 → 해당 유저만 정확히 강퇴.
//   - 만료 경로: 이벤트가 없는 자연 만료를 잡는 주기 스윕(모든 소켓의 방 자격 재검증).
// 강퇴된 클라이언트는 'revoked' 메시지를 받고 구독 상태를 다시 조회합니다.
export class EntitlementEnforcer {
  private readonly socketsByUser = new Map<number, Set<ServerWebSocket<SocketData>>>()
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly rooms: RoomRegistry) {}

  register(ws: ServerWebSocket<SocketData>): void {
    const sockets = this.socketsByUser.get(ws.data.userId)

    if (sockets) {
      sockets.add(ws)
    } else {
      this.socketsByUser.set(ws.data.userId, new Set([ws]))
    }
  }

  unregister(ws: ServerWebSocket<SocketData>): void {
    const sockets = this.socketsByUser.get(ws.data.userId)

    if (!sockets) {
      return
    }

    sockets.delete(ws)

    if (sockets.size === 0) {
      this.socketsByUser.delete(ws.data.userId)
    }
  }

  // connectPubSub 이후에 호출해야 합니다. RoomRegistry와 같은 subscriber 연결을 공유하고,
  // 채널로 필터링하므로 서로의 메시지를 침범하지 않습니다.
  async start(): Promise<void> {
    await subscriberClient.subscribe(ENTITLEMENT_CHANNEL)

    subscriberClient.on('message', (channel: string, message: string) => {
      if (channel === ENTITLEMENT_CHANNEL) {
        void this.handleRevoked(message)
      }
    })

    this.timer = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async handleRevoked(raw: string): Promise<void> {
    let event: EntitlementRevokedEvent
    try {
      event = JSON.parse(raw) as EntitlementRevokedEvent
    } catch {
      return
    }

    if (event.t !== 'revoked') {
      return
    }

    const room = `b:${event.artistId}`
    invalidateAccessCache(event.userId, room)

    const sockets = this.socketsByUser.get(event.userId)
    if (!sockets) {
      return
    }

    for (const ws of sockets) {
      if (ws.data.rooms.has(room)) {
        await this.kick(ws, room)
      }
    }
  }

  private async sweep(): Promise<void> {
    for (const sockets of this.socketsByUser.values()) {
      for (const ws of sockets) {
        for (const room of [...ws.data.rooms]) {
          try {
            if (!(await canAccessStream(ws.data.userId, room))) {
              await this.kick(ws, room)
            }
          } catch (error) {
            // 재검증 실패(DB 장애 등)는 fail open — 다음 스윕이 다시 시도한다.
            console.error('entitlement sweep recheck failed', { userId: ws.data.userId, room, error })
          }
        }
      }
    }
  }

  private async kick(ws: ServerWebSocket<SocketData>, room: string): Promise<void> {
    await this.rooms.unsubscribe(ws, room)
    ws.send(encode({ t: 'revoked', room }))
  }
}
