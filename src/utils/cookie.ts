import type { JWTPayload } from 'jose'

import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies } from 'next/headers'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { sec } from './format/date'
import { JWTType, signJWT, verifyJWT } from './jwt'

export type AccessTokenClaims = {
  userId: number
  adult: boolean
}

type AccessTokenPayload = JWTPayload & {
  adult?: boolean
}

type AuthTokenClaims = {
  userId: number | string
  adult: boolean
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

export async function getAccessTokenClaimsFromCookie(): Promise<AccessTokenClaims | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyJWT<AccessTokenPayload>(accessToken, JWTType.ACCESS).catch(() => null)
  const userId = payload?.sub ? Number(payload.sub) : null

  if (!userId || !Number.isFinite(userId)) {
    return null
  }

  return {
    userId,
    adult: payload?.adult === true,
  }
}

export async function getAccessTokenCookieConfig({ userId, adult }: AuthTokenClaims) {
  const cookieValue = await signJWT({ sub: String(userId), adult }, JWTType.ACCESS)

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

export function getAuthHintCookieConfig({ maxAgeSeconds }: { maxAgeSeconds: number }) {
  return {
    key: CookieKey.AUTH_HINT,
    value: '1',
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: false,
      maxAge: maxAgeSeconds,
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export async function getRefreshTokenCookieConfig({ userId, adult }: AuthTokenClaims) {
  const cookieValue = await signJWT({ sub: String(userId), adult }, JWTType.REFRESH)

  return {
    key: CookieKey.REFRESH_TOKEN,
    value: cookieValue,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: sec('30 days'),
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

export async function setRefreshTokenCookie(cookieStore: ReadonlyRequestCookies, claims: AuthTokenClaims) {
  const { key, value, options } = await getRefreshTokenCookieConfig(claims)
  cookieStore.set(key, value, options)
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
      cookieStore.delete({ name: CookieKey.AUTH_HINT, domain: COOKIE_DOMAIN })
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
