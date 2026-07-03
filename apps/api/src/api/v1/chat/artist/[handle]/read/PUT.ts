import { chatHandleParamSchema, putV1ChatReadBodySchema } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { setFanReadWatermark } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { resolveTimelineAccess } from '../../../access'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', putV1ChatReadBodySchema),
)

route.put('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { lastReadMessageId } = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const access = await resolveTimelineAccess(userId, artist)

  if (!access) {
    return problemResponse(c, { status: 403 })
  }

  if (access.kind !== 'owner') {
    await setFanReadWatermark({
      fanId: userId,
      artistId: artist.id,
      lastReadMessageId,
    })
  }

  return c.body(null, 204)
})

export default route
