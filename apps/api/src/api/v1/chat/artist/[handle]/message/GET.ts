import { chatHandleParamSchema, type GETV1ChatMessagesResponse, getV1ChatMessagesQuerySchema } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import {
  type ChatBroadcastRow,
  type ChatDmMessageRow,
  countReplyRoomUnread,
  getDmMessagesByIds,
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
// Access: owner / entitled fan → full broadcast; lapsed fan → broadcast sent during the
// windows they paid for; never-subscribed → 403. The 1:1 history is always readable.
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

  // 만료(lapsed) 팬은 결제했던 기간에 발송된 방송만 열람할 수 있다.
  const windows =
    access.kind === 'lapsed'
      ? access.intervals.map((interval) => ({
          fromId: messageIdAtOrAfter(interval.startedAt),
          toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
        }))
      : undefined

  const fanTimeline = await buildFanTimeline(artist.id, userId, { before, after, limit, windows })
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
  artistId: number,
  fanId: number,
  { before, after, limit, windows }: PageOptions & { windows?: TimelineWindow[] },
): Promise<GETV1ChatMessagesResponse> {
  const isForward = Boolean(after) && !before

  const [broadcasts, dmRows] = await Promise.all([
    listBroadcast(artistId, { windows, before, after, limit }),
    listFanTimeline({ artistId, fanId, before, after, limit }),
  ])

  let threshold: string | null = null

  if (!isForward) {
    const lasts: string[] = []

    if (broadcasts.length === limit) {
      lasts.push(broadcasts[broadcasts.length - 1].messageId)
    }

    if (dmRows.length === limit) {
      lasts.push(dmRows[dmRows.length - 1].messageId)
    }

    threshold = lasts.length ? lasts.reduce((a, b) => (a > b ? a : b)) : null
  }

  let tagged: TaggedRow[] = [
    ...broadcasts.map((row) => ({ messageId: row.messageId, broadcast: row })),
    ...dmRows.map((row) => ({ messageId: row.messageId, dm: row })),
  ]

  tagged.sort((a, b) => (isForward ? a.messageId.localeCompare(b.messageId) : b.messageId.localeCompare(a.messageId)))

  if (threshold) {
    tagged = tagged.filter((row) => row.messageId >= threshold!)
  }

  // Resolve quoted-message previews in one batch (both quote targets live in this (artist,fan)
  // conversation). The client decides whether to actually render the quote (only if not adjacent).
  const quotedIds = [...new Set(tagged.filter((row) => row.dm?.quotedMessageId).map((row) => row.dm!.quotedMessageId!))]
  const quotedRows = await getDmMessagesByIds(artistId, fanId, quotedIds)

  const items = tagged.map((row) => {
    if (row.broadcast) {
      return toBroadcastFeedItem(row.broadcast)
    }

    const quotedRow = row.dm!.quotedMessageId ? quotedRows.get(row.dm!.quotedMessageId) : undefined
    return toDmFeedItem(row.dm!, quotedRow && toQuotedPreview(quotedRow))
  })

  return {
    items,
    nextCursor: threshold ?? undefined,
  }
}

export default route
