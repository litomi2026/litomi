import { getRemotePayment, isBillingConfigured } from '@litomi/billing'
import { problemCode } from '@litomi/contracts'
import { getPaymentByPaymentId } from '@litomi/db/app/query/payment'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const paramSchema = z.object({
  paymentId: z.string().min(1).max(64),
})

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', paramSchema))

// PG 매출전표(영수증)로 리다이렉트 — 본인 결제만. URL은 조회 시점에 PG에서 받아온다.
route.get('/', ...middlewares, async (c) => {
  if (!isBillingConfigured()) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('userId')!
  const { paymentId } = c.req.valid('param')
  const payment = await getPaymentByPaymentId(paymentId)

  if (!payment || payment.userId !== userId) {
    return problemResponse(c, { status: 404 })
  }

  let remote: Awaited<ReturnType<typeof getRemotePayment>>
  try {
    remote = await getRemotePayment(paymentId)
  } catch (error) {
    console.error('billing: receipt getPayment failed', { paymentId, error })
    return problemResponse(c, { status: 502 })
  }

  if (!remote.receiptUrl) {
    return problemResponse(c, {
      status: 404,
      code: problemCode.RECEIPT_NOT_READY,
      title: '영수증이 아직 준비되지 않았어요.',
    })
  }

  return c.redirect(remote.receiptUrl, 302)
})

export default route
