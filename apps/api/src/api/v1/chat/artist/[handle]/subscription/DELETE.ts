import { chatHandleParamSchema, type DELETEV1ChatSubscriptionResponse } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST, setAutoRenew } from '@litomi/db/app/query/subscription'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toSubscriptionDTO } from '../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const subscription = await setAutoRenew(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id, false)

  if (!subscription) {
    return problemResponse(c, { status: 404 })
  }

  return c.json({ subscription: toSubscriptionDTO(subscription) } satisfies DELETEV1ChatSubscriptionResponse)
})

export default route
