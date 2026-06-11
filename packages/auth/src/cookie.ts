import type { JWTPayload } from 'jose'

import { CookieKey } from '@litomi/http/cookie'
import { sec } from '@litomi/std'
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

const ADULT_PASS_COOKIE_MAX_AGE_SECONDS = sec('30 days')
const ADULT_PASS_COOKIE_DOMAIN = '.litomi.in'

export async function getAccessTokenCookieConfig({ userId, adult }: AccessTokenClaims) {
  const cookieValue = await signJWT({ sub: String(userId), adult }, JWTType.ACCESS)

  return {
    key: CookieKey.ACCESS_TOKEN,
    value: cookieValue,
    options: {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export function getAdultPassCookieClearConfig(): AuthCookieConfig {
  return {
    key: CookieKey.ADULT_PASS,
    value: '',
    options: {
      domain: ADULT_PASS_COOKIE_DOMAIN,
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  }
}

export function getAdultPassCookieConfig(): AuthCookieConfig {
  return {
    key: CookieKey.ADULT_PASS,
    value: '1',
    options: {
      domain: ADULT_PASS_COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: ADULT_PASS_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  }
}

export function getAdultPassCookieConfigForAdult(adult: boolean): AuthCookieConfig {
  return adult ? getAdultPassCookieConfig() : getAdultPassCookieClearConfig()
}

export function getAuthCookieClearConfigs(): AuthCookieConfig[] {
  const expires = new Date(0)

  return [
    getAdultPassCookieClearConfig(),
    {
      key: CookieKey.ACCESS_TOKEN,
      value: '',
      options: {
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
      httpOnly: true,
      maxAge: maxAgeSeconds,
      path: '/',
      sameSite: 'strict',
      secure: true,
    },
  } as const
}

export async function getUserIdFromCookie() {
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

  return userId
}
