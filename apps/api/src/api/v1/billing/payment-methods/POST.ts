import { inspectBillingKey, isBillingConfigured } from '@litomi/billing'
import { type POSTV1PaymentMethodResponse, postV1PaymentMethodBodySchema } from '@litomi/contracts'
import { savePaymentMethod } from '@litomi/db/app/query/payment-method'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1PaymentMethodBodySchema))

// Register a payment method: the provider token the client just issued (via
// @portone/browser-sdk today). We validate it against PortOne (rejecting fake tokens) and
// store only the opaque token + display brief.
route.post('/', ...middlewares, async (c) => {
  if (!isBillingConfigured()) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('userId')!
  const { token } = c.req.valid('json')

  let brief: Awaited<ReturnType<typeof inspectBillingKey>>
  try {
    brief = await inspectBillingKey(token)
  } catch (error) {
    console.error('billing: inspectBillingKey failed', error)
    return problemResponse(c, { status: 400 })
  }

  const { id } = await savePaymentMethod({
    userId,
    token,
    brand: brief.brand,
    cardLast4: brief.cardLast4,
  })

  return c.json({
    id,
    brand: brief.brand,
    cardLast4: brief.cardLast4,
    createdAt: new Date().toISOString(),
  } satisfies POSTV1PaymentMethodResponse)
})

export default route
