import { type GETV1BillingPaymentsResponse, getV1BillingPaymentsQuerySchema } from '@litomi/contracts'
import { listPaymentsOfUser } from '@litomi/db/app/query/payment'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('query', getV1BillingPaymentsQuerySchema))

// 결제 내역(최신순 keyset) — 실패 건도 그대로 보여 준다(갱신 실패 안내·CS 대비).
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { before, limit } = c.req.valid('query')
  const rows = await listPaymentsOfUser(userId, { beforeId: before, limit })

  const response = {
    payments: rows.map((row) => ({
      id: row.id,
      paymentId: row.paymentId,
      orderName: row.orderName,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      method: row.method,
      refundedAmount: row.refundedAmount,
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor: rows.length === limit ? (rows.at(-1)?.id ?? null) : null,
  } satisfies GETV1BillingPaymentsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
