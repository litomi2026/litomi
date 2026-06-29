export type ChatMessageKind = 'broadcast' | 'reply'

// 크리에이터가 자신의 모든 팬들에게 일방향으로 보내는 "공지방(Broadcast)"의 고유 ID를 만듭니다.
export function toBroadcastStreamId(creatorId: number): string {
  return `b:${creatorId}`
}

// 크리에이터와 특정 팬 한 명이 주고받는 "1:1 개인톡(Reply)" 방의 고유 ID를 만듭니다.
export function toReplyStreamId(creatorId: number, fanId: number): string {
  return `r:${creatorId}:${fanId}`
}

export function getKindFromStreamId(streamId: string): ChatMessageKind {
  return streamId.startsWith('b:') ? 'broadcast' : 'reply'
}

export type ParsedStreamId =
  | { kind: 'broadcast'; creatorId: number }
  | { kind: 'reply'; creatorId: number; fanId: number }

// streamId 자체에 접근 정책이 인코딩되어 있습니다.
export function parseStreamId(streamId: string): ParsedStreamId | null {
  const parts = streamId.split(':')

  if (parts[0] === 'b' && parts.length === 2) {
    const creatorId = toPositiveInt(parts[1])
    return creatorId === null ? null : { kind: 'broadcast', creatorId }
  }

  if (parts[0] === 'r' && parts.length === 3) {
    const creatorId = toPositiveInt(parts[1])
    const fanId = toPositiveInt(parts[2])
    return creatorId === null || fanId === null ? null : { kind: 'reply', creatorId, fanId }
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
