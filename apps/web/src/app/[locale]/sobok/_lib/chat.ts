import type { ChatMessageDTO, ChatRelayMessageDTO, ChatReplyDTO, ChatTimelineMessage } from '@litomi/contracts'
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

export interface FanTimelineEntry {
  message: ChatMessageDTO
  myReplies: ChatReplyDTO[]
  artistRead: boolean
}

export type FanTimelineItem =
  | {
      id: string
      kind: 'message'
      message: ChatMessageDTO
    }
  | {
      id: string
      kind: 'reply'
      reply: ChatReplyDTO
      read: boolean
    }

export function buildFanTimeline(
  fetched: ChatTimelineMessage[],
  realtime: ChatMessageDTO[],
  optimisticReplies: Record<string, ChatReplyDTO[]>,
): FanTimelineEntry[] {
  const byId = new Map<string, FanTimelineEntry>()

  for (const item of fetched) {
    byId.set(item.message.messageId, {
      message: item.message,
      myReplies: [...(item.myReplies ?? [])],
      artistRead: item.artistReadMyReplies ?? false,
    })
  }

  for (const message of realtime) {
    if (!byId.has(message.messageId)) {
      byId.set(message.messageId, { message, myReplies: [], artistRead: false })
    }
  }

  for (const [messageId, replies] of Object.entries(optimisticReplies)) {
    const entry = byId.get(messageId)

    if (!entry) {
      continue
    }

    const seen = new Set(entry.myReplies.map((r) => r.messageId))

    for (const reply of replies) {
      if (!seen.has(reply.messageId)) {
        entry.myReplies.push(reply)
      }
    }
  }

  const entries = [...byId.values()].sort((a, b) => a.message.messageId.localeCompare(b.message.messageId))

  for (const entry of entries) {
    entry.myReplies.sort((a, b) => a.messageId.localeCompare(b.messageId))
  }

  return entries
}

export function flattenFanTimeline(timeline: FanTimelineEntry[]): FanTimelineItem[] {
  const items: FanTimelineItem[] = []

  for (const entry of timeline) {
    items.push({ id: entry.message.messageId, kind: 'message', message: entry.message })

    for (const reply of entry.myReplies) {
      items.push({ id: reply.messageId, kind: 'reply', reply, read: entry.artistRead })
    }
  }

  return items.sort((a, b) => a.id.localeCompare(b.id))
}

// Replies that ended up detached from their target message in the flat order — these
// render with a quoted preview so the fan can tell what they replied to.
export function getQuotedReplyIds(items: FanTimelineItem[]): Set<string> {
  const ids = new Set<string>()
  let lastMessageId: string | null = null

  for (const item of items) {
    if (item.kind === 'message') {
      lastMessageId = item.message.messageId
    } else if (item.reply.targetMessageId !== lastMessageId) {
      ids.add(item.reply.messageId)
    }
  }

  return ids
}
