import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { ONE_HOUR, THIRTY_DAYS } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { signJWT, TokenType, verifyJWT } from './jwt'

export function getJSONCookie(cookieStore: ReadonlyRequestCookies, keys: string[]) {
  const result: Record<string, string | undefined> = {}

  for (const key of keys) {
    result[key] = cookieStore.get(key)?.value
  }
  return result
}

export async function getUserIdFromAccessToken(cookieStore: ReadonlyRequestCookies) {
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value
  if (!accessToken) return null

  const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => ({ sub: null }))

  if (!userId) {
    cookieStore.delete(CookieKey.ACCESS_TOKEN)
    return null
  }

  return userId
}

export async function setAccessTokenCookie(
  cookieStore: ReadonlyRequestCookies | ResponseCookies,
  userId: number | string,
) {
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
  })
}
