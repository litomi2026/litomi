import { revokeBillingKey } from '@litomi/billing'
import { getActivePaymentMethodForUser, markPaymentMethodDeleted } from '@litomi/db/app/query/payment-method'
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
  const method = await getActivePaymentMethodForUser(id, userId)

  if (!method) {
    return problemResponse(c, { status: 404 })
  }

  try {
    await revokeBillingKey(method.token)
  } catch (error) {
    // The token may already be gone at PortOne; drop it locally regardless.
    console.error('billing: revokeBillingKey failed', error)
  }

  await markPaymentMethodDeleted(id, userId)

  return c.body(null, 204)
})

export default route
