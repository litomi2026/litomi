import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { JWTType, verifyJWT } from '@litomi/auth/jwt'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { refreshSession } from '@litomi/auth/session/persistent-session'
import { CookieKey } from '@litomi/domain/constants/storage'
import { getRequestUserAgent } from '@litomi/http/request'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

import type { Env } from '../app'

import { applyAuthCookie } from '../utils/cookie'

export const auth = createMiddleware<Env>(async (c, next) => {
  const accessToken = getCookie(c, CookieKey.ACCESS_TOKEN)
  const atPayload = accessToken ? await verifyJWT(accessToken, JWTType.ACCESS).catch(() => null) : undefined
  const validATUserId = atPayload?.sub

  if (validATUserId) {
    c.set('userId', Number(validATUserId))
    c.set('isAdult', atPayload?.adult === true)
    return await next()
  }

  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  if (!refreshToken) {
    if (atPayload === null) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
    }
    return await next()
  }

  const deviceLabel = buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers))
  const refreshResult = await refreshSession(refreshToken, deviceLabel)

  if (!refreshResult.ok) {
    applyAuthCookie(c, getAuthCookieClearConfigs())
    return await next()
  }

  applyAuthCookie(c, refreshResult.cookies)
  c.set('userId', refreshResult.userId)
  c.set('isAdult', refreshResult.adult)

  return await next()
})
