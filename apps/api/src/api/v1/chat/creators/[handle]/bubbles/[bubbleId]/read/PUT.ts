import { chatBubbleParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { setReadCursor, toBubbleReplyStreamId } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedCreator } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatBubbleParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

// The creator marks one bubble's reply room read up to lastReadMessageId. A fan learns
// the creator read their reply by comparing it to this cursor (A · room-level receipt).
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { bubbleId } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const ownership = await requireOwnedCreator(c)

  if ('error' in ownership) {
    return ownership.error
  }

  await setReadCursor(userId, toBubbleReplyStreamId(ownership.creator.id, bubbleId), lastReadMessageId)

  return c.body(null, 204)
})

export default route
