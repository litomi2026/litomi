import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { refreshSession } from '@litomi/auth/session/persistent-session'
import { CookieKey } from '@litomi/http/cookie'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { noStoreCacheControl } from '@/utils/cache-control'
import { applyAuthCookie } from '@/utils/cookie'
import { authRequiredProblemResponse, problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'

const refreshIpLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-refresh:ip',
})

const route = new Hono<Env>()

route.post('/', async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const limitResult = await refreshIpLimiter.check(remoteIP)

  if (!limitResult.allowed) {
    return tooManyRequestsProblemResponse(c, limitResult.retryAfter)
  }

  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  const deviceLabel = buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers))

  try {
    const refreshResult = await refreshSession(refreshToken, deviceLabel)

    if (!refreshResult.ok) {
      applyAuthCookie(c, refreshResult.cookies)

      return authRequiredProblemResponse(c, { headers: { 'Cache-Control': noStoreCacheControl } })
    }

    applyAuthCookie(c, refreshResult.cookies)
    await refreshIpLimiter.reward(remoteIP)
    c.header('Cache-Control', noStoreCacheControl)

    return c.body(null, 204)
  } catch (error) {
    console.error(error)

    return problemResponse(c, {
      status: 500,
      headers: { 'Cache-Control': noStoreCacheControl },
    })
  }
})

export default route
