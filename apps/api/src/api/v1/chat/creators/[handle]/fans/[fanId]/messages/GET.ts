import { chatFanIdParamSchema, type GETV1ChatMessagesResponse, getV1ChatMessagesQuerySchema } from '@litomi/contracts'
import { listTimelineMessages, toReplyStreamId } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { mapMessageRow, requireOwnedCreator } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const handlers = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatFanIdParamSchema),
  zProblemValidator('query', getV1ChatMessagesQuerySchema),
)

route.get('/', ...handlers, async (c) => {
  const { fanId } = c.req.valid('param')
  const owned = await requireOwnedCreator(c)

  if ('error' in owned) {
    return owned.error
  }

  const { before, after, limit } = c.req.valid('query')
  const streams = [{ streamId: toReplyStreamId(owned.creator.id, fanId) }]
  const rows = await listTimelineMessages(streams, { before, after, limit })

  const result = {
    messages: rows.map(mapMessageRow),
    nextCursor: rows.length === limit ? rows[rows.length - 1]?.messageId : null,
  }

  return c.json<GETV1ChatMessagesResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
