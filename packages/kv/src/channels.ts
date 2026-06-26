// Canonical Valkey Pub/Sub channel naming — the contract between message
// publishers (api/worker) and the chat gateway subscriber. Single-sourced here
// so a divergent string can't silently break realtime delivery.

const ROOM_CHANNEL_PREFIX = 'litomi:chat:room:'

export function roomChannel(roomId: string): string {
  return `${ROOM_CHANNEL_PREFIX}${roomId}`
}

export function roomIdFromChannel(channel: string): string | null {
  return channel.startsWith(ROOM_CHANNEL_PREFIX) ? channel.slice(ROOM_CHANNEL_PREFIX.length) : null
}
