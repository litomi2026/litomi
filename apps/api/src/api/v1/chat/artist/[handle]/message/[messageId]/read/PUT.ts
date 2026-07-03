import { chatMessageParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { setReadCursor, toMessageReplyStreamId } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedArtist } from '../../../../../access'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatMessageParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

// The artist marks one message's reply room read up to lastReadMessageId. A fan learns
// the artist read their reply by comparing it to this cursor (A · room-level receipt).
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { messageId } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const ownership = await requireOwnedArtist(c)

  if ('error' in ownership) {
    return ownership.error
  }

  await setReadCursor({
    userId,
    streamId: toMessageReplyStreamId(ownership.artist.id, messageId),
    lastReadMessageId,
  })

  return c.body(null, 204)
})

export default route
