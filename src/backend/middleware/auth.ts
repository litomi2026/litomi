import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { getAccessTokenCookieConfig } from '@/utils/cookie'
import { JWTType, verifyJWT } from '@/utils/jwt'

import { Env } from '..'

export const auth = createMiddleware<Env>(async (c, next) => {
  const accessToken = getCookie(c, CookieKey.ACCESS_TOKEN)
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  // null: 토큰 만료/무효, undefined: 토큰 없음
  const atPayload = accessToken ? await verifyJWT(accessToken, JWTType.ACCESS).catch(() => null) : undefined
  const rtPayload = refreshToken ? await verifyJWT(refreshToken, JWTType.REFRESH).catch(() => null) : undefined

  const validATUserId = atPayload?.sub
  const isATExpired = atPayload === null
  const isATMissing = atPayload === undefined
  const validRTUserId = rtPayload?.sub
  const isRTExpired = rtPayload === null
  const isRTMissing = rtPayload === undefined

  if (validATUserId) {
    // AT 유효, RT 유효 -> next()
    if (validRTUserId) {
      c.set('userId', Number(validATUserId))
      return await next()
    }
    // AT 유효, RT 만료/무효 -> RT 삭제
    if (isRTExpired) {
      c.set('userId', Number(validATUserId))
      deleteCookie(c, CookieKey.REFRESH_TOKEN, { domain: COOKIE_DOMAIN })
      return await next()
    }
    // AT 유효, RT 없음 -> next()
    if (isRTMissing) {
      c.set('userId', Number(validATUserId))
      return await next()
    }
  }

  if (isATExpired) {
    // AT 만료/무효, RT 유효 -> AT 갱신
    if (validRTUserId) {
      const { key, value, options } = await getAccessTokenCookieConfig(validRTUserId)
      setCookie(c, key, value, options)
      c.set('userId', Number(validRTUserId))
      return await next()
    }
    // AT 만료/무효, RT 만료/무효 -> AT, RT 삭제
    if (isRTExpired) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN, { domain: COOKIE_DOMAIN })
      deleteCookie(c, CookieKey.REFRESH_TOKEN, { domain: COOKIE_DOMAIN })
      return await next()
    }
    // AT 만료/무효, RT 없음 -> AT 삭제
    if (isRTMissing) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN, { domain: COOKIE_DOMAIN })
      return await next()
    }
  }

  if (isATMissing) {
    // AT 없음, RT 유효 -> AT 갱신
    if (validRTUserId) {
      const { key, value, options } = await getAccessTokenCookieConfig(validRTUserId)
      setCookie(c, key, value, options)
      c.set('userId', Number(validRTUserId))
      return await next()
    }
    // AT 없음, RT 만료/무효 -> RT 삭제
    if (isRTExpired) {
      deleteCookie(c, CookieKey.REFRESH_TOKEN, { domain: COOKIE_DOMAIN })
      return await next()
    }
    // AT 없음, RT 없음 -> next()
    if (isRTMissing) {
      return await next()
    }
  }

  // 도달하지 않아야 함
  return await next()
})
