import { type GETV1PointTurnstileResponse, PROBLEM } from '@litomi/contracts'

import { CookieKey } from '@litomi/http/cookie'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

import { verifyPointsTurnstileToken } from '../util-turnstile-cookie'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  const cookieValue = getCookie(c, CookieKey.POINTS_TURNSTILE)

  if (!cookieValue) {
    return problemResponse(c, { problem: PROBLEM.TURNSTILE_REQUIRED })
  }

  const verified = await verifyPointsTurnstileToken(cookieValue)

  if (!verified || verified.userId !== userId) {
    deleteCookie(c, CookieKey.POINTS_TURNSTILE, { path: '/api/v1/points', secure: true })
    return problemResponse(c, { problem: PROBLEM.TURNSTILE_REQUIRED })
  }

  const remainingMs = verified.expiresAt.getTime() - Date.now()
  const expiresInSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const response = { verified: true, expiresInSeconds } satisfies GETV1PointTurnstileResponse

  return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
