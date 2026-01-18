import { createMiddleware } from 'hono/factory'

import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/backend/utils/adult-gate'

import type { Env } from '..'

export const requireAdult = createMiddleware<Env>(async (c, next) => {
  if (!shouldBlockAdultGate(c)) {
    return await next()
  }

  return adultVerificationRequiredResponse(c)
})
