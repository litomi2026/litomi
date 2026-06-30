export type ChatMessageKind = 'broadcast' | 'reply'

// 아티스트가 모든 팬에게 보내는 "공지방(Broadcast)" — 말풍선(message)들이 쌓이는 스트림.
export function toBroadcastStreamId(artistId: number): string {
  return `b:${artistId}`
}

// 말풍선(message) 하나에 달린 모든 팬의 답장이 모이는 "답장방" 스트림.
// 팬은 append만 하고, 아티스트만 방 전체를 읽습니다. 팬끼리는 서로의 답장을 볼 수 없습니다.
export function toMessageReplyStreamId(artistId: number, messageId: string): string {
  return `rb:${artistId}:${messageId}`
}

// 아티스트의 실시간 인바운드 채널 — 모든 팬 답장이 fan-in 되는 곳(오너 전용 구독).
// 저장 스트림이 아니라 Valkey 릴레이 전용 채널입니다(chat_message에 이 streamId로 저장되는 행은 없음).
export function toArtistInboundChannel(artistId: number): string {
  return `c:${artistId}`
}

export function getKindFromStreamId(streamId: string): ChatMessageKind {
  return streamId.startsWith('b:') ? 'broadcast' : 'reply'
}

export type ParsedStreamId =
  | {
      kind: 'broadcast'
      artistId: number
    }
  | {
      kind: 'reply'
      artistId: number
      messageId: string
    }

// 저장 스트림 파서(워커/저장 경로용): b:{artistId} | rb:{artistId}:{messageId}.
// (실시간 구독 권한 파서는 게이트웨이의 entitlements.ts에 별도로 존재합니다 — b:/c:만 취급)
export function parseStreamId(streamId: string): ParsedStreamId | null {
  const parts = streamId.split(':')

  if (parts[0] === 'b' && parts.length === 2) {
    const artistId = toPositiveInt(parts[1])
    return artistId === null ? null : { kind: 'broadcast', artistId }
  }

  // ULID는 Crockford base32라 콜론을 포함하지 않으므로 split(':')이 정확히 3조각이 됩니다.
  if (parts[0] === 'rb' && parts.length === 3) {
    const artistId = toPositiveInt(parts[1])
    const messageId = parts[2]
    return artistId === null || !messageId ? null : { kind: 'reply', artistId, messageId }
  }

  return null
}

function toPositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
