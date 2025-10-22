import type { MiddlewareHandler } from 'hono'

import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { CookieKey } from '@/constants/storage'
import { JWTType, signJWT, verifyJWT } from '@/utils/jwt'

import { Env } from '..'

export const refreshAuthToken = (): MiddlewareHandler<Env> => {
  return async (c, next) => {
    const accessToken = getCookie(c, CookieKey.ACCESS_TOKEN)

    // 미로그인 -> 통과
    if (!accessToken) {
      return await next()
    }

    const validAccessToken = await verifyJWT(accessToken, JWTType.ACCESS).catch(() => null)

    // 로그인 -> 통과
    if (validAccessToken) {
      return await next()
    }

    const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

    // at 만료 및 rt 없음 -> at 쿠키 삭제
    if (!refreshToken) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN)
      return await next()
    }

    const validRefreshToken = await verifyJWT(refreshToken, JWTType.REFRESH).catch(() => null)
    const userId = validRefreshToken?.sub

    // at 만료 및 rt 만료 -> at, rt 쿠키 삭제
    if (!userId) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN)
      deleteCookie(c, CookieKey.REFRESH_TOKEN)
      return await next()
    }

    // at 만료 및 rt 유효 -> at 재발급
    setCookie(c, CookieKey.ACCESS_TOKEN, await signJWT({ sub: userId }, JWTType.ACCESS), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 15,
    })

    return await next()
  }
}
