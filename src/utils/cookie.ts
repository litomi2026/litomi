import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies } from 'next/headers'

import { ONE_HOUR, THIRTY_DAYS } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { signJWT, TokenType, verifyJWT } from './jwt'

type CookieStore = Awaited<ReturnType<typeof cookies>>

export function getCookieJSON(cookieStore: ReadonlyRequestCookies, keys: string[]) {
  const result: Record<string, string | undefined> = {}

  for (const key of keys) {
    result[key] = cookieStore.get(key)?.value
  }
  return result
}

export async function getUserIdFromCookie() {
  const cookieStore = await cookies()
  return (await verifyAccessToken(cookieStore)) ?? null
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

export async function validateUserIdFromCookie() {
  const cookieStore = await cookies()
  const userId = await verifyAccessToken(cookieStore)

  if (!userId) {
    if (userId === null) {
      cookieStore.delete(CookieKey.ACCESS_TOKEN)
    }
    return null
  }

  return userId
}

async function verifyAccessToken(cookieStore: CookieStore) {
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value

  if (!accessToken) {
    return
  }

  const payload = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => null)
  const userId = payload?.sub
  return userId ? Number(userId) : null
}
