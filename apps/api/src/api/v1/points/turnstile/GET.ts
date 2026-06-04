import type { GETV1PointTurnstileResponse } from '@litomi/contracts'

import { CookieKey } from '@litomi/http/cookie'
import { problemCode } from '@litomi/http/problem-details'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

import { verifyPointsTurnstileToken } from '../util-turnstile-cookie'

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  const cookieValue = getCookie(c, CookieKey.POINTS_TURNSTILE)

  if (!cookieValue) {
    return problemResponse(c, {
      status: 403,
      code: problemCode.TURNSTILE_REQUIRED,
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const verified = await verifyPointsTurnstileToken(cookieValue)

  if (!verified || verified.userId !== userId) {
    deleteCookie(c, CookieKey.POINTS_TURNSTILE, { path: '/api/v1/points' })
    return problemResponse(c, {
      status: 403,
      code: problemCode.TURNSTILE_REQUIRED,
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const remainingMs = verified.expiresAt.getTime() - Date.now()
  const expiresInSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const response: GETV1PointTurnstileResponse = { verified: true, expiresInSeconds }

  return c.json<GETV1PointTurnstileResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
