import { chatHandleParamSchema, type GETV1ChatMessagesResponse, getV1ChatMessagesQuerySchema } from '@litomi/contracts'
import { getChatCreatorByHandle, hasActiveChatSubscription, listPaidIntervals } from '@litomi/db/app/query/chat'
import {
  listTimelineMessages,
  messageIdAtOrAfter,
  type TimelineStream,
  toBroadcastStreamId,
  toReplyStreamId,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { mapMessageRow } from '../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('query', getV1ChatMessagesQuerySchema),
)

// A fan reads a creator as one merged timeline: the creator's broadcast plus their
// own 1:1 reply thread. Access policy:
//   - owner            → their broadcast feed
//   - entitled fan     → broadcast (full archive) + own 1:1
//   - lapsed fan       → own 1:1 (perpetual) + broadcasts sent during their paid windows
//   - never-subscribed → 403
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { before, after, limit } = c.req.valid('query')
  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return problemResponse(c, { status: 404 })
  }

  let streams: TimelineStream[]
  if (creator.userId === userId) {
    streams = [{ streamId: toBroadcastStreamId(creator.id) }]
  } else if (await hasActiveChatSubscription(userId, creator.id)) {
    streams = [{ streamId: toBroadcastStreamId(creator.id) }, { streamId: toReplyStreamId(creator.id, userId) }]
  } else {
    // Lapsed/never-subscribed: the 1:1 thread is perpetual, but the broadcast is
    // scoped to the windows the fan actually paid for. No paid window ever ⇒ no access.
    const intervals = await listPaidIntervals(userId, creator.id)

    if (intervals.length === 0) {
      return problemResponse(c, { status: 403 })
    }

    streams = [
      {
        streamId: toBroadcastStreamId(creator.id),
        windows: intervals.map((interval) => ({
          fromId: messageIdAtOrAfter(interval.startedAt),
          toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
        })),
      },
      { streamId: toReplyStreamId(creator.id, userId) },
    ]
  }

  const rows = await listTimelineMessages(streams, { before, after, limit })

  // A full page implies more may exist; continue with the last id in the page
  // direction (before for scroll-up, after for forward sync).
  const nextCursor = rows.length === limit ? rows[rows.length - 1]?.messageId : null

  return c.json<GETV1ChatMessagesResponse>(
    { messages: rows.map(mapMessageRow), nextCursor },
    { headers: { 'Cache-Control': privateCacheControl } },
  )
})

export default route
