import { chatHandleParamSchema, type GETV1ChatArtistResponse } from '@litomi/contracts'
import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import { getSubscription } from '@litomi/db/app/query/subscription'
import { resolveReplyTextLimit } from '@litomi/domain/chat/policy'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/domain/subscription/policy'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toArtistBrief, toSubscriptionDTO } from '../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const isOwner = artist.userId === userId

  const [subscription, intervals] = isOwner
    ? [undefined, []]
    : await Promise.all([
        getSubscription({
          userId,
          targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
          targetId: artist.id,
        }),
        listPaidIntervals({
          userId,
          artistId: artist.id,
        }),
      ])

  // 열람권과 답장 길이 한도는 같은 정본(paid invoice 구간)에서 함께 나온다 — 한도가 있으면 결제 중.
  const replyTextLimit = isOwner ? undefined : resolveReplyTextLimit(intervals, new Date())
  const entitled = isOwner || replyTextLimit !== undefined

  const response = {
    artist: { ...toArtistBrief(artist), description: artist.description },
    isOwner,
    entitled,
    price:
      artist.isActive && artist.priceAmount > 0
        ? { amount: artist.priceAmount, currency: artist.priceCurrency }
        : undefined,
    subscription: subscription && toSubscriptionDTO(subscription),
    replyTextLimit,
  } satisfies GETV1ChatArtistResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
