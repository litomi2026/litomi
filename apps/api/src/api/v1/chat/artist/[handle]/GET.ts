import { chatHandleParamSchema, type GETV1ChatArtistResponse } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { getSubscription, SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/db/app/query/subscription'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toArtistBrief, toSubscriptionDTO } from '../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

// Resolves a handle to the artist's id and the viewer's role. The client needs the
// artistId to build realtime room ids (b:{id} / c:{id}) and the role to pick the UI
// (studio vs fan room) — neither is derivable from the auth'd userId alone.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const isOwner = artist.userId === userId
  const subscription = isOwner ? null : await getSubscription(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id)
  const entitled = isOwner || (subscription !== null && subscription.expiresAt.getTime() > Date.now())

  const response = {
    artist: { ...toArtistBrief(artist), description: artist.description },
    isOwner,
    entitled,
    price: artist.priceAmount > 0 ? { amount: artist.priceAmount, currency: artist.priceCurrency } : null,
    subscription: subscription ? toSubscriptionDTO(subscription) : null,
  } satisfies GETV1ChatArtistResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
