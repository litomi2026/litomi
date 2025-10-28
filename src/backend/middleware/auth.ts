import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { getAccessTokenCookieConfig } from '@/utils/cookie'
import { JWTType, verifyJWT } from '@/utils/jwt'

import { Env } from '..'

const cookieDomain = process.env.NODE_ENV === 'production' ? COOKIE_DOMAIN : undefined

export const auth = createMiddleware<Env>(async (c, next) => {
  const accessToken = getCookie(c, CookieKey.ACCESS_TOKEN)
  const validAccessToken = await verifyJWT(accessToken ?? '', JWTType.ACCESS).catch(() => null)
  const loginUserId = validAccessToken?.sub

  // at 유효 -> 통과
  if (loginUserId) {
    c.set('userId', Number(loginUserId))
    return await next()
  }

  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  // at 만료 및 rt 없음 -> at 쿠키 삭제
  if (!refreshToken) {
    deleteCookie(c, CookieKey.ACCESS_TOKEN, { domain: cookieDomain })
    return await next()
  }

  const validRefreshToken = await verifyJWT(refreshToken, JWTType.REFRESH).catch(() => null)
  const userId = validRefreshToken?.sub

  // at 만료 및 rt 만료 -> at, rt 쿠키 삭제
  if (!userId) {
    deleteCookie(c, CookieKey.ACCESS_TOKEN, { domain: cookieDomain })
    deleteCookie(c, CookieKey.REFRESH_TOKEN, { domain: cookieDomain })
    return await next()
  }

  // at 만료 및 rt 유효 -> at 재발급
  const { key, value, options } = await getAccessTokenCookieConfig(userId)
  setCookie(c, key, value, options)
  c.set('userId', Number(userId))
  return await next()
})
