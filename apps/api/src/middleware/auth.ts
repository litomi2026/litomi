import { JWTType, verifyJWT } from '@litomi/auth/jwt'
import { CookieKey } from '@litomi/http/cookie'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { errors } from 'jose'

import type { Env } from '../app'

export const auth = createMiddleware<Env>(async (c, next) => {
  const accessToken = getCookie(c, CookieKey.ACCESS_TOKEN)

  if (!accessToken) {
    return await next()
  }

  try {
    const payload = await verifyJWT(accessToken, JWTType.ACCESS)
    const userId = Number(payload.sub)

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return await next()
    }

    c.set('userId', userId)
    c.set('isAdult', payload.adult === true)
  } catch (error) {
    if (!(error instanceof errors.JOSEError)) {
      throw error
    }
  }

  return await next()
})
