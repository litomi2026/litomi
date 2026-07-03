import type { GETV1BillingSubscriptionsResponse } from '@litomi/contracts'
import { listChatSubscriptionsOfUser } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

const route = new Hono<Env>()

// 결제 허브의 구독 목록 — 만료·해지 이력 포함 전체.
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const rows = await listChatSubscriptionsOfUser(userId)

  const response = {
    subscriptions: rows.map((row) => ({
      artist: row.artist,
      subscription: {
        status: row.status,
        expiresAt: row.expiresAt.toISOString(),
        autoRenew: row.autoRenew,
      },
      priceAmount: row.priceAmount,
      priceCurrency: row.priceCurrency,
    })),
  } satisfies GETV1BillingSubscriptionsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
