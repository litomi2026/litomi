import { createMiddleware } from 'hono/factory'

import { authRequiredProblemResponse } from '@/utils/problem'

import type { Env } from '../app'

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const userId = c.get('userId')

  if (!userId) {
    return authRequiredProblemResponse(c)
  }

  return await next()
})
