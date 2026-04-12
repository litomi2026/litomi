import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

import { refreshSession } from '@/common/session'
import { CookieKey } from '@/constants/storage'
import { getAuthCookieClearConfigs } from '@/utils/cookie'
import { JWTType, verifyJWT } from '@/utils/jwt'
import { getRequestUserAgent } from '@/utils/request'
import { buildSessionDeviceLabel } from '@/utils/session'

import { Env } from '..'
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
