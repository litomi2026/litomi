// Canonical Valkey Pub/Sub channel naming — the contract between message
// publishers (chat-worker) and the chat gateway subscriber. Single-sourced here
// so a divergent string can't silently break realtime delivery.
//
// roomId is opaque to this layer; its taxonomy lives in @litomi/db/chat/query/channel
// (b:/c:/fc:/rr:). Because roomId is what a subscriber SUBSCRIBEs on, it is also the
// natural shard key: to move Valkey to cluster mode, switch the subscriber to SSUBSCRIBE
// and the publisher to SPUBLISH keyed on roomId (single-instance today, so plain (P)SUB).

const ROOM_CHANNEL_PREFIX = 'litomi:chat:room:'

export function roomChannel(roomId: string): string {
  return `${ROOM_CHANNEL_PREFIX}${roomId}`
}

export function roomIdFromChannel(channel: string): string | null {
  return channel.startsWith(ROOM_CHANNEL_PREFIX) ? channel.slice(ROOM_CHANNEL_PREFIX.length) : null
}

// 자격 강퇴 제어 채널 — 환불처럼 접근 권한이 즉시 사라져야 하는 이벤트를 api가 흘리고,
// 게이트웨이가 해당 유저의 소켓을 방에서 내보낸다(만료는 게이트웨이의 주기 재검증이 처리).
export const ENTITLEMENT_CHANNEL = 'litomi:chat:entitlement'

export interface EntitlementRevokedEvent {
  t: 'revoked'
  userId: number
  artistId: number
}
