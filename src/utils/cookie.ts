import { ONE_HOUR, THIRTY_DAYS } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { signJWT, TokenType } from './jwt'

export async function setAccessTokenCookie(cookieStore: ReadonlyRequestCookies, userId: number | string) {
  cookieStore.set(CookieKey.ACCESS_TOKEN, await signJWT({ sub: String(userId) }, TokenType.ACCESS), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ONE_HOUR,
  })
}

export async function setRefreshTokenCookie(cookieStore: ReadonlyRequestCookies, userId: number | string) {
  cookieStore.set(CookieKey.REFRESH_TOKEN, await signJWT({ sub: String(userId) }, TokenType.REFRESH), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    path: '/api/auth/refresh',
  })
}
