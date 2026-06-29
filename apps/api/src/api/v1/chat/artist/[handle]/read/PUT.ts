import { chatHandleParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
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

// Advance the fan's broadcast read watermark for this artist (stored under b:{C}).
route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  // The artist authors their own broadcast, so there's nothing to mark read there.
  if (artist.userId !== userId) {
    // Anyone who ever paid can read this timeline (entitled, or lapsed with paid-window
    // broadcasts), so anyone with a paid window may advance their read cursor.
    if ((await listPaidIntervals(userId, artist.id)).length === 0) {
      return problemResponse(c, { status: 403 })
    }

    await setFanReadWatermark(userId, artist.id, lastReadMessageId)
  }

  return c.body(null, 204)
})

export default route
