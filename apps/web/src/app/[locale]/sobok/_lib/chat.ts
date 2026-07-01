import type { ChatContentType, ChatMessageContent, ChatMessageDTO, ChatRelayMessageDTO } from '@litomi/contracts'
import { env } from '@litomi/env/client'
import dayjs from 'dayjs'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function formatDateSeparator(ts: number): string {
  const target = new Date(ts)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const targetDay = startOfDay(target)

  if (targetDay === startOfDay(now)) {
    return '오늘'
  }

  if (targetDay === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()) {
    return '어제'
  }

  if (target.getFullYear() === now.getFullYear()) {
    return `${dayjs(ts).format('M월 D일')} (${WEEKDAYS_KO[target.getDay()]})`
  }

  return dayjs(ts).format('YYYY년 M월 D일')
}

export function getChatWebSocketURL(): string {
  if (window.location.hostname === 'localhost') {
    return `${env.NEXT_PUBLIC_CHAT_WS_ORIGIN}/ws`
  }

  return `wss://${window.location.host}/ws`
}

export function textOf(content: ChatMessageContent): string {
  return 'text' in content && typeof content.text === 'string' ? content.text : '미디어'
}

export function contentPreview(contentType: ChatContentType, content: ChatMessageContent): string {
  if (contentType === 'text' && 'text' in content && typeof content.text === 'string') {
    return content.text
  }

  switch (contentType) {
    case 'image':
      return '사진'
    case 'voice':
      return '음성 메시지'
    case 'video':
      return '동영상'
    default:
      return '미디어'
  }
}

export function toChatMessageDTO(msg: ChatRelayMessageDTO): ChatMessageDTO {
  return {
    messageId: msg.messageId,
    senderId: msg.senderId,
    contentType: msg.contentType,
    content: msg.content,
    createdAt: msg.createdAt,
  }
}

export function avatarURL(name: string, imageURL: string | null | undefined): string {
  return imageURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
}

// Merges fetched items with realtime ones, deduped by id (fetched wins), sorted ascending by
// id. Chat ids are ULIDs, so id order is chronological — this is the canonical "infinite-query
// pages ∪ realtime stream" reconciliation used by the studio rooms.
export function mergeById<T>(fetched: T[], realtime: T[], idOf: (item: T) => string): T[] {
  const byId = new Map<string, T>()

  for (const item of fetched) {
    byId.set(idOf(item), item)
  }

  for (const item of realtime) {
    if (!byId.has(idOf(item))) {
      byId.set(idOf(item), item)
    }
  }

  return [...byId.values()].sort((a, b) => idOf(a).localeCompare(idOf(b)))
}
