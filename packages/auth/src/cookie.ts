import type { JWTPayload } from 'jose'

import { COOKIE_DOMAIN } from '@litomi/http/cookie'
import { CookieKey } from '@litomi/http/cookie'
import { sec } from '@litomi/std'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies } from 'next/headers'

import { JWTType, signJWT, verifyJWT } from './jwt'

export type AuthCookieConfig = {
  key: string
  value: string
  options: AuthCookieOptions
}

type AccessTokenClaims = {
  userId: number
  adult: boolean
}

type AccessTokenPayload = JWTPayload & {
  adult?: boolean
}

type AuthCookieOptions = {
  domain?: string
  expires?: Date
  httpOnly: boolean
  maxAge?: number
  path?: string
  sameSite: 'strict'
  secure: boolean
}

type RefreshTokenClaims = {
  userId: number | string
  adult: boolean
}

export function applyCookieConfigs(
  cookieStore: Pick<ReadonlyRequestCookies, 'set'>,
  cookieConfigs: readonly AuthCookieConfig[],
) {
  for (const cookie of cookieConfigs) {
    cookieStore.set(cookie.key, cookie.value, cookie.options)
  }
}

export async function getAccessTokenClaimsFromCookie() {
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

export async function getAccessTokenCookieConfig({ userId, adult }: AccessTokenClaims) {
  const cookieValue = await signJWT({ sub: String(userId), adult }, JWTType.ACCESS)

  return {
    key: CookieKey.ACCESS_TOKEN,
    value: cookieValue,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export function getAuthCookieClearConfigs(): AuthCookieConfig[] {
  const expires = new Date(0)

  return [
    {
      key: CookieKey.ACCESS_TOKEN,
      value: '',
      options: {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        maxAge: 0,
        expires,
        path: '/',
        sameSite: 'strict',
        secure: true,
      },
    },
    {
      key: CookieKey.REFRESH_TOKEN,
      value: '',
      options: {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        maxAge: 0,
        expires,
        path: '/',
        sameSite: 'strict',
        secure: true,
      },
    },
    {
      key: CookieKey.AUTH_HINT,
      value: '',
      options: {
        domain: COOKIE_DOMAIN,
        httpOnly: false,
        maxAge: 0,
        expires,
        path: '/',
        sameSite: 'strict',
        secure: true,
      },
    },
  ]
}

export function getAuthHintCookieConfig({ maxAgeSeconds }: { maxAgeSeconds?: number | null } = {}) {
  return {
    key: CookieKey.AUTH_HINT,
    value: '1',
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: false,
      path: '/',
      sameSite: 'strict',
      secure: true,
      ...(typeof maxAgeSeconds === 'number' && { maxAge: maxAgeSeconds }),
    },
  } as const
}

export function getPasskeyAuthenticationAttemptCookieConfig(attemptId: string) {
  return {
    key: CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT,
    value: attemptId,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: sec('3 minutes'),
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export function getRefreshSessionCookieConfig({ token, maxAgeSeconds }: { token: string; maxAgeSeconds: number }) {
  return {
    key: CookieKey.REFRESH_TOKEN,
    value: token,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: maxAgeSeconds,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export async function getRefreshTokenCookieConfig({ userId, adult }: RefreshTokenClaims) {
  const cookieValue = await signJWT({ sub: String(userId), adult }, JWTType.REFRESH)

  return {
    key: CookieKey.REFRESH_TOKEN,
    value: cookieValue,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: sec('30 days'),
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export async function getUserIdFromCookie(): Promise<number | null> {
  return (await getAccessTokenClaimsFromCookie())?.userId ?? null
}
