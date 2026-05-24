import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { refreshSession } from '@litomi/auth/session/persistent-session'
import { CookieKey } from '@litomi/http/cookie'
import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { noStoreCacheControl } from '@/utils/cache-control'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'

const refreshIpLimiter = new RateLimiter({
  ...RateLimitPresets.strict(),
  keyPrefix: 'auth-refresh:ip:',
})

const route = new Hono<Env>()

route.post('/', async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const limitResult = await refreshIpLimiter.check(remoteIP)

  if (!limitResult.allowed) {
    const retryAfter = limitResult.retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(retryAfter / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: {
        'Cache-Control': noStoreCacheControl,
        'Retry-After': String(retryAfter),
      },
    })
  }

  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  const deviceLabel = buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers))

  try {
    const refreshResult = await refreshSession(refreshToken, deviceLabel)

    if (!refreshResult.ok) {
      applyAuthCookie(c, refreshResult.cookies)

      return problemResponse(c, {
        status: 401,
        detail: '로그인 정보가 없거나 만료됐어요',
        headers: { 'Cache-Control': noStoreCacheControl },
      })
    }

    applyAuthCookie(c, refreshResult.cookies)
    await refreshIpLimiter.reward(remoteIP)
    c.header('Cache-Control', noStoreCacheControl)

    return c.body(null, 204)
  } catch (error) {
    console.error(error)

    return problemResponse(c, {
      status: 500,
      detail: '로그인 정보를 갱신하지 못했어요',
      headers: { 'Cache-Control': noStoreCacheControl },
    })
  }
})

export default route
