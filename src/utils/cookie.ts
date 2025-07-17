import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { ONE_HOUR, THIRTY_DAYS } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { signJWT, TokenType, verifyJWT } from './jwt'

export function getCookieJSON(cookieStore: ReadonlyRequestCookies, keys: string[]) {
  const result: Record<string, string | undefined> = {}

  for (const key of keys) {
    result[key] = cookieStore.get(key)?.value
  }
  return result
}

export async function getUserIdFromAccessToken(cookieStore: ReadonlyRequestCookies, reset: boolean = true) {
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => null)

  if (!payload || !payload.sub) {
    if (reset) {
      cookieStore.delete(CookieKey.ACCESS_TOKEN)
    }
    return null
  }

  return payload.sub
}

export async function setAccessTokenCookie(
  cookieStore: ReadonlyRequestCookies | ResponseCookies,
  userId: number | string,
) {
  const cookieValue = await signJWT({ sub: String(userId) }, TokenType.ACCESS)

  cookieStore.set(CookieKey.ACCESS_TOKEN, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ONE_HOUR,
  })
}

export async function setRefreshTokenCookie(cookieStore: ReadonlyRequestCookies, userId: number | string) {
  const cookieValue = await signJWT({ sub: String(userId) }, TokenType.REFRESH)

  cookieStore.set(CookieKey.REFRESH_TOKEN, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
  })
}
