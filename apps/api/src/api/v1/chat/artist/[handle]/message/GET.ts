import { chatHandleParamSchema, type GETV1ChatMessagesResponse, getV1ChatMessagesQuerySchema } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import {
  type ChatBroadcastRow,
  type ChatDmMessageRow,
  countReplyRoomUnread,
  getDmMessagesByIds,
  getReplyRoomWatermarks,
  listBroadcast,
  listFanTimeline,
  messageIdAtOrAfter,
  type TimelineWindow,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { resolveTimelineAccess } from '../../../access'
import { toBroadcastFeedItem, toDmFeedItem, toQuotedPreview } from '../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('query', getV1ChatMessagesQuerySchema),
)

// The fan timeline is the artist's broadcast feed woven together with the fan's 1:1 messages
// (their replies + the artist's answers), merged in messageId (time) order. The owner instead
// gets just their broadcast feed plus each bubble's unread-reply count.
// Access: owner → full broadcast; fan → broadcast sent during the windows they paid for
// (current subscription included, pre-subscription excluded); never-subscribed → 403.
// The 1:1 history is always readable.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { before, after, limit } = c.req.valid('query')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const access = await resolveTimelineAccess(userId, artist)

  if (!access) {
    return problemResponse(c, { status: 403 })
  }

  if (access.kind === 'owner') {
    const broadcasts = await listBroadcast(artist.id, { before, after, limit })

    const unread = await countReplyRoomUnread(
      userId,
      artist.id,
      broadcasts.map((row) => row.messageId),
    )

    const ownerTimeline = {
      items: broadcasts.map(toBroadcastFeedItem),
      replyUnread: Object.fromEntries(unread),
      nextCursor: broadcasts.length === limit ? broadcasts.at(-1)?.messageId : undefined,
    }

    return c.json(ownerTimeline, { headers: { 'Cache-Control': noStoreCacheControl } })
  }

  // 팬은 결제한 기간에 발송된 방송만 열람한다 — 현재 구독 중이어도 구독 이전 방송은 제외된다.
  // 현재 구간은 expiresAt이 미래라 진행 중인 기간의 방송을 자연스럽게 모두 덮는다.
  const windows = access.intervals.map((interval) => ({
    fromId: messageIdAtOrAfter(interval.startedAt),
    toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
  }))

  const fanTimeline = await buildFanTimeline(artist, userId, { before, after, limit, windows })

  return c.json(fanTimeline, { headers: { 'Cache-Control': noStoreCacheControl } })
})

interface PageOptions {
  before?: string
  after?: string
  limit: number
}

interface TaggedRow {
  messageId: string
  broadcast?: ChatBroadcastRow
  dm?: ChatDmMessageRow
}

// Fan view: merge two keyset streams (broadcast feed + the fan's 1:1 messages). For backward
// paging we only emit down to the highest "last id" among the SATURATED sources — beyond that
// a source may still hold newer-than-cursor rows we didn't fetch, so we page there next round.
// This guarantees the merge never skips an item. (Duplicates across pages dedupe by id client-side.)
async function buildFanTimeline(
  // artist.userId null = 탈퇴한 아티스트 tombstone — 읽음 커서도 파기되었으므로 receipt 없음.
  artist: { id: number; userId: number | null },
  fanId: number,
  { before, after, limit, windows }: PageOptions & { windows: TimelineWindow[] },
): Promise<GETV1ChatMessagesResponse> {
  const artistId = artist.id
  const isForward = Boolean(after) && !before

  const [broadcasts, dmRows] = await Promise.all([
    listBroadcast(artistId, { windows, before, after, limit }),
    listFanTimeline({ artistId, fanId, before, after, limit }),
  ])

  let threshold: string | undefined

  if (!isForward) {
    const lasts: string[] = []

    if (broadcasts.length === limit) {
      lasts.push(broadcasts[broadcasts.length - 1].messageId)
    }

    if (dmRows.length === limit) {
      lasts.push(dmRows[dmRows.length - 1].messageId)
    }

    threshold = lasts.length ? lasts.reduce((a, b) => (a > b ? a : b)) : undefined
  }

  let tagged: TaggedRow[] = [
    ...broadcasts.map((row) => ({
      messageId: row.messageId,
      broadcast: row,
    })),
    ...dmRows.map((row) => ({
      messageId: row.messageId,
      dm: row,
    })),
  ]

  tagged.sort((a, b) => (isForward ? a.messageId.localeCompare(b.messageId) : b.messageId.localeCompare(a.messageId)))

  if (threshold) {
    tagged = tagged.filter((row) => row.messageId >= threshold!)
  }

  // Resolve quoted-message previews in one batch (both quote targets live in this (artist,fan)
  // conversation). The client decides whether to actually render the quote (only if not adjacent).
  const quotedIds = [...new Set(tagged.filter((row) => row.dm?.quotedMessageId).map((row) => row.dm!.quotedMessageId!))]

  // Room-level receipt: the artist's reply-room watermark for each room this page's fan replies
  // belong to, so the fan can render "읽음" on replies at or below the watermark.
  const fanReplyContextIds = [
    ...new Set(tagged.filter((row) => row.dm?.senderRole === 'fan').map((row) => row.dm!.contextMessageId)),
  ]

  const [quotedRows, watermarks] = await Promise.all([
    getDmMessagesByIds(artistId, fanId, quotedIds),
    artist.userId === null
      ? new Map<string, string>()
      : getReplyRoomWatermarks({ artistUserId: artist.userId, artistId, contextMessageIds: fanReplyContextIds }),
  ])

  const items = tagged.map((row) => {
    if (row.broadcast) {
      return toBroadcastFeedItem(row.broadcast)
    }

    const quotedRow = row.dm!.quotedMessageId ? quotedRows.get(row.dm!.quotedMessageId) : undefined
    return toDmFeedItem(row.dm!, quotedRow && toQuotedPreview(quotedRow))
  })

  return {
    items,
    nextCursor: threshold,
    ...(watermarks.size > 0 && { replyReadCursor: Object.fromEntries(watermarks) }),
  }
}

export default route
