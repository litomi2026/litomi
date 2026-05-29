import { createMiddleware } from 'hono/factory'

import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'

import type { Env } from '../app'

export const requireAdult = createMiddleware<Env>(async (c, next) => {
  if (shouldBlockAdultGate(c)) {
    return adultVerificationRequiredResponse(c)
  }

  return await next()
})
