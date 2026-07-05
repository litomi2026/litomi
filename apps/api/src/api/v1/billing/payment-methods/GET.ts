import { env } from '@litomi/billing/env'
import type { GETV1PaymentMethodsResponse } from '@litomi/contracts'
import { listActivePaymentMethods } from '@litomi/db/app/query/payment-method'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

const { PORTONE_STORE_ID, PORTONE_CHANNEL_KEY } = env

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.get('/', ...middlewares, async (c) => {
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
