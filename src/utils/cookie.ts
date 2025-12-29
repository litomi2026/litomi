import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies } from 'next/headers'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { sec } from './format/date'
import { JWTType, signJWT, verifyJWT } from './jwt'

type CookieStore = Awaited<ReturnType<typeof cookies>>

export async function getAccessTokenCookieConfig(userId: number | string) {
  const cookieValue = await signJWT({ sub: String(userId) }, JWTType.ACCESS)

  return {
    key: CookieKey.ACCESS_TOKEN,
    value: cookieValue,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: sec('1 hour'),
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

/**
 * For server component
 */
export async function getUserIdFromCookie() {
  const cookieStore = await cookies()
  return (await verifyAccessToken(cookieStore)) ?? null
}

export async function setRefreshTokenCookie(cookieStore: ReadonlyRequestCookies, userId: number | string) {
  const cookieValue = await signJWT({ sub: String(userId) }, JWTType.REFRESH)

  cookieStore.set(CookieKey.REFRESH_TOKEN, cookieValue, {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    maxAge: sec('30 days'),
    sameSite: 'strict',
    secure: true,
  })
}

/**
 * For server action, router handler
 */
export async function validateUserIdFromCookie() {
  const cookieStore = await cookies()
  const userId = await verifyAccessToken(cookieStore)

  if (!userId) {
    if (userId === null) {
      cookieStore.delete({ name: CookieKey.ACCESS_TOKEN, domain: COOKIE_DOMAIN })
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

  const payload = await verifyJWT(accessToken, JWTType.ACCESS).catch(() => null)
  const userId = payload?.sub
  return userId ? Number(userId) : null
}
