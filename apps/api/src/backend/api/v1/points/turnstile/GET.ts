import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { verifyPointsTurnstileToken } from '../util-turnstile-cookie'

export type GETV1PointTurnstileResponse = { verified: true; expiresInSeconds: number }

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  const cookieValue = getCookie(c, CookieKey.POINTS_TURNSTILE)

  if (!cookieValue) {
    return problemResponse(c, {
      status: 403,
      code: 'turnstile-required',
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const verified = await verifyPointsTurnstileToken(cookieValue)

  if (!verified || verified.userId !== userId) {
    deleteCookie(c, CookieKey.POINTS_TURNSTILE, { domain: COOKIE_DOMAIN, path: '/api/v1/points' })
    return problemResponse(c, {
      status: 403,
      code: 'turnstile-required',
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const remainingMs = verified.expiresAt.getTime() - Date.now()
  const expiresInSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const response: GETV1PointTurnstileResponse = { verified: true, expiresInSeconds }

  return c.json<GETV1PointTurnstileResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
