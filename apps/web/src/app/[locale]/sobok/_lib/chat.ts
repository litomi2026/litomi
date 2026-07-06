import type { ChatFeedItem, ChatReplyRoomItem } from '@litomi/contracts'
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

// A setState updater that appends `item` unless one with the same messageId is already present.
// Realtime/optimistic messages can arrive twice (WS relay + refetch), so appends must dedupe.
export function appendById<T extends { messageId: string }>(item: T) {
  return (prev: T[]): T[] => (prev.some((existing) => existing.messageId === item.messageId) ? prev : [...prev, item])
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
  // The quoted message is the viewer's own (→ label "me"); otherwise the other party's.
  isMine: boolean
}

type Side = 'artist' | 'fan'

// Each timeline projects into this normalized shape, then one algorithm resolves quotes for both.
interface QuoteScanItem {
  messageId: string
  side: Side
  text: string
  // The message this one answers — undefined renders no quote header.
  answeredId?: string
  // Server-embedded preview, used when the answered message isn't in the loaded window.
  fallback?: { preview: string; side: Side }
}

// A message shows a quote header only when the message it answers is NOT the other party's most
// recent message before it (skipping the sender's own consecutive run) — otherwise they're
// visually adjacent. `mineSide` is the viewer's side, so a quote of their own reads as "me".
function resolveQuotes(items: QuoteScanItem[], mineSide: Side): Map<string, QuoteInfo> {
  const byId = new Map(items.map((item) => [item.messageId, item]))
  const quotes = new Map<string, QuoteInfo>()

  let lastFanId: string | undefined
  let lastArtistId: string | undefined

  for (const item of items) {
    const nearestOtherId = item.side === 'fan' ? lastArtistId : lastFanId

    if (item.answeredId && item.answeredId !== nearestOtherId) {
      const target = byId.get(item.answeredId)
      quotes.set(item.messageId, {
        targetId: item.answeredId,
        preview: target ? target.text : (item.fallback?.preview ?? ''),
        isMine: (target ? target.side : item.fallback?.side) === mineSide,
      })
    }

    if (item.side === 'fan') {
      lastFanId = item.messageId
    } else {
      lastArtistId = item.messageId
    }
  }

  return quotes
}

// Fan timeline: broadcasts (no quote), the fan's replies (answer their context bubble unless they
// explicitly quote an artist answer), the artist's answers (quote the fan message). Viewer = fan.
export function computeQuotes(items: ChatFeedItem[]): Map<string, QuoteInfo> {
  return resolveQuotes(
    items.map((item) => {
      const side: Side = item.kind === 'fanReply' ? 'fan' : 'artist'

      return {
        messageId: item.messageId,
        side,
        text: item.content.text,
        answeredId:
          item.kind === 'broadcast'
            ? undefined
            : (item.quotedMessageId ?? (side === 'fan' ? item.contextMessageId : undefined)),
        fallback:
          item.kind !== 'broadcast' && item.quoted
            ? { preview: item.quoted.preview, side: item.quoted.senderRole }
            : undefined,
      }
    }),
    'fan',
  )
}

// Reply room: a flat cross-fan timeline; only explicit quotes (the room itself is the context).
// Viewer = the artist.
export function computeReplyRoomQuotes(items: ChatReplyRoomItem[]): Map<string, QuoteInfo> {
  return resolveQuotes(
    items.map((item) => ({
      messageId: item.messageId,
      side: item.senderRole,
      text: item.content.text,
      answeredId: item.quotedMessageId,
      fallback: item.quoted
        ? {
            preview: item.quoted.preview,
            side: item.quoted.senderRole,
          }
        : undefined,
    })),
    'artist',
  )
}
