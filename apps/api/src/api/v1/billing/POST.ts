import { env } from '@litomi/billing/env'
import { BILLING_CURRENCY, BILLING_TEST_AMOUNT, type POSTV1BillingTestPaymentResponse } from '@litomi/contracts'
import { createPendingPayment } from '@litomi/db/app/query/payment'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'

const { PORTONE_STORE_ID, PORTONE_CHANNEL_KEY } = env
const ORDER_NAME = 'litomi 결제 테스트'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.post('/test-payments', ...middlewares, async (c) => {
  if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('userId')!
  const paymentId = crypto.randomUUID()

  try {
    await createPendingPayment({
      paymentId,
      userId,
      orderName: ORDER_NAME,
      amount: BILLING_TEST_AMOUNT,
    })
  } catch (error) {
    console.error('billing: createPendingPayment failed', error)
    return problemResponse(c, { status: 500 })
  }

  return c.json({
    paymentId,
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    orderName: ORDER_NAME,
    amount: BILLING_TEST_AMOUNT,
    currency: BILLING_CURRENCY,
  } satisfies POSTV1BillingTestPaymentResponse)
})

export default route
