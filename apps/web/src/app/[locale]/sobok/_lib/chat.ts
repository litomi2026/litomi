import type { ChatFeedItem } from '@litomi/contracts'
import { env } from '@litomi/env/client'

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export interface DateSeparatorLabels {
  today: string
  yesterday: string
}

export function formatDateSeparator(ts: number, languageTag: string, labels: DateSeparatorLabels): string {
  const target = new Date(ts)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const targetDay = startOfDay(target)

  if (targetDay === startOfDay(now)) {
    return labels.today
  }

  if (targetDay === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()) {
    return labels.yesterday
  }

  if (target.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(languageTag, { month: 'long', day: 'numeric', weekday: 'short' }).format(target)
  }

  return new Intl.DateTimeFormat(languageTag, { year: 'numeric', month: 'long', day: 'numeric' }).format(target)
}

export function getChatWebSocketURL(): string {
  if (window.location.hostname === 'localhost') {
    return `${env.NEXT_PUBLIC_CHAT_WS_ORIGIN}/ws`
  }

  return `wss://${window.location.host}/ws`
}

export function avatarURL(name: string, imageURL: string | null | undefined): string {
  return imageURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
}

// Merges fetched items with realtime ones, deduped by id (fetched wins), sorted ascending by
// id. Chat ids are ULIDs, so id order is chronological — the canonical "infinite-query pages ∪
// realtime stream" reconciliation used by the studio rooms.
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

// The fan timeline is broadcasts + the fan's replies + the artist's 1:1 answers, already merged
// server-side into ChatFeedItem[]. Client-side we union the fetched pages with realtime and
// optimistic items, deduped by messageId (fetched is authoritative), sorted chronologically.
export function mergeFeedItems(
  fetched: ChatFeedItem[],
  realtime: ChatFeedItem[],
  optimistic: ChatFeedItem[],
): ChatFeedItem[] {
  const byId = new Map<string, ChatFeedItem>()

  // Later sets win, so seed with the least-authoritative first.
  for (const item of optimistic) {
    byId.set(item.messageId, item)
  }
  for (const item of realtime) {
    byId.set(item.messageId, item)
  }
  for (const item of fetched) {
    byId.set(item.messageId, item)
  }

  return [...byId.values()].sort((a, b) => a.messageId.localeCompare(b.messageId))
}

export interface QuoteInfo {
  // The messageId this item answers (scroll/highlight target).
  targetId: string
  // The answered message's text (from the loaded timeline, else the server-embedded preview).
  preview: string
  // The quoted message is the fan's own (→ label "me"); otherwise it's the artist's.
  isMine: boolean
}

// Which items should render a quote header, and what it points at. A reply quotes the message
// it answers (a fan reply → its context bubble unless it explicitly quotes; an artist answer →
// the fan message it quotes). We hide the quote when the answered message is the OTHER party's
// most recent message before this one — i.e. skipping the sender's own consecutive messages,
// they're effectively adjacent. It only shows when they're genuinely "far apart" (another
// other-party message sits between them, or the answered message isn't loaded).
export function computeQuotes(items: ChatFeedItem[]): Map<string, QuoteInfo> {
  const byId = new Map(items.map((item) => [item.messageId, item]))
  const quotes = new Map<string, QuoteInfo>()

  // Most recent messageId seen per party as we scan forward (the fan vs. the artist).
  let lastFanId: string | undefined
  let lastArtistId: string | undefined

  for (const item of items) {
    const isFan = item.kind === 'fanReply'
    // The nearest preceding message from the OTHER party (skips this sender's own run).
    const nearestOtherId = isFan ? lastArtistId : lastFanId

    if (item.kind !== 'broadcast') {
      const answeredId = item.quotedMessageId ?? (isFan ? item.contextMessageId : undefined)

      if (answeredId && nearestOtherId !== answeredId) {
        const target = byId.get(answeredId)
        quotes.set(item.messageId, {
          targetId: answeredId,
          preview: target ? target.content.text : (item.quoted?.preview ?? ''),
          isMine: target ? target.kind === 'fanReply' : item.quoted?.senderRole === 'fan',
        })
      }
    }

    if (isFan) {
      lastFanId = item.messageId
    } else {
      lastArtistId = item.messageId
    }
  }

  return quotes
}
