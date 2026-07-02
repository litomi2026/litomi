import type { GETV1PaymentMethodsResponse } from '@litomi/contracts'
import { listActivePaymentMethods } from '@litomi/db/app/query/payment-method'
import { env } from '@litomi/env/server.common'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

const { PORTONE_STORE_ID, PORTONE_CHANNEL_KEY } = env

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const methods = await listActivePaymentMethods(userId)

  const response = {
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    paymentMethods: methods.map((method) => ({
      id: method.id,
      brand: method.brand,
      cardLast4: method.cardLast4,
      createdAt: method.createdAt.toISOString(),
    })),
  } satisfies GETV1PaymentMethodsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
