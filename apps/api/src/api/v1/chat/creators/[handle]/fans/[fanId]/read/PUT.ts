import { chatFanIdParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { setReadCursor, toReplyStreamId } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'
import { requireAuth } from '@/middleware/require-auth'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedCreator } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const handlers = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatFanIdParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

route.put('/', ...handlers, async (c) => {
  const { fanId } = c.req.valid('param')
  const owned = await requireOwnedCreator(c)

  if ('error' in owned) {
    return owned.error
  }

  const { lastReadMessageId } = c.req.valid('json')
  const userId = c.get('userId')!
  await setReadCursor(userId, toReplyStreamId(owned.creator.id, fanId), lastReadMessageId)

  return c.body(null, 204)
})

export default route
