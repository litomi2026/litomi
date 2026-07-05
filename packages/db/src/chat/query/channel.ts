// Canonical realtime room-id naming — the contract shared by the api (publish), the
// chat-worker (relay), the gateway (authorize), and the web client (subscribe). Single-sourced
// so a divergent string can't silently break realtime delivery. (Read cursors are keyed by
// structured columns, not these strings — see chat_read_cursor / chat_reply_read_cursor.)
//
// Realtime rooms (Valkey pub/sub, wrapped by @litomi/kv roomChannel):
//   b:{artistId}            broadcast feed        — paid fan | owner
//   c:{artistId}            artist inbound aggregate (all fan replies, sampled) — owner
//   fc:{artistId}:{fanId}   fan inbound (artist's 1:1 answers to this fan)      — that fan
//   rr:{artistId}:{msgId}   focused reply room live (un-sampled)                — owner

export function broadcastRoom(artistId: number): string {
  return `b:${artistId}`
}

export function artistAggregateRoom(artistId: number): string {
  return `c:${artistId}`
}

export function fanInboundRoom(artistId: number, fanId: number): string {
  return `fc:${artistId}:${fanId}`
}

export function replyRoom(artistId: number, messageId: string): string {
  return `rr:${artistId}:${messageId}`
}
