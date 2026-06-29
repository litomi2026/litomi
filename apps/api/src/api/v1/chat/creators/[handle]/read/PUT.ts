import { chatHandleParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { getChatCreatorByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import { setFanReadWatermark } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

// Advance the fan's broadcast read watermark for this creator (stored under b:{C}).
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return problemResponse(c, { status: 404 })
  }

  // The creator authors their own broadcast, so there's nothing to mark read there.
  if (creator.userId !== userId) {
    // Anyone who ever paid can read this timeline (entitled, or lapsed with paid-window
    // broadcasts), so anyone with a paid window may advance their read cursor.
    if ((await listPaidIntervals(userId, creator.id)).length === 0) {
      return problemResponse(c, { status: 403 })
    }

    await setFanReadWatermark(userId, creator.id, lastReadMessageId)
  }

  return c.body(null, 204)
})

export default route
