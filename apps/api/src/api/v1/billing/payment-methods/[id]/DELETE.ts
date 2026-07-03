import { revokeBillingKey } from '@litomi/billing'
import { markPaymentMethodDeleted } from '@litomi/db/app/query/payment-method'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', paramSchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')
  const deleted = await markPaymentMethodDeleted(id, userId)

  if (!deleted) {
    return problemResponse(c, { status: 404 })
  }

  try {
    await revokeBillingKey(deleted.token)
  } catch (error) {
    console.error('billing: revokeBillingKey failed', error)
  }

  return c.body(null, 204)
})

export default route
