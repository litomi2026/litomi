import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@litomi/auth/cookie'
import { issuePersistentSession } from '@litomi/auth/session/persistent-session'
import { hash } from 'bcryptjs'
import { expect } from 'bun:test'

import { getTrustedBrowserCookieConfig, signTrustedBrowserToken } from '@/api/v1/auth/login/2fa/util'

import { getSetCookieStrings } from './app'

export const TEST_LOGIN_PASSWORD = 'Password123'

const passwordHashCache = new Map<string, Promise<string>>()

type AccessCookieInput = {
  adult?: boolean
  userId: number
}

type SessionCookieInput = {
  deviceLabel?: string | null
  userId: number
}

type TrustedBrowserCookieInput = {
  browserId: string
  fingerprint: string
  userId: number
}

export async function createAccessTokenCookies({ userId, adult = false }: AccessCookieInput) {
  const cookieConfig = await getAccessTokenCookieConfig({ userId, adult })

  return {
    cookieConfigs: [cookieConfig],
    cookieHeader: serializeCookieHeader([cookieConfig]),
  }
}

export async function createRefreshSessionCookies({ userId, deviceLabel = 'Backend Test Device' }: SessionCookieInput) {
  const issuedSession = await issuePersistentSession(userId, deviceLabel)

  const cookieConfigs = [
    getRefreshSessionCookieConfig({
      token: issuedSession.token,
      maxAgeSeconds: issuedSession.maxAgeSeconds,
    }),
    getAuthHintCookieConfig({ maxAgeSeconds: issuedSession.maxAgeSeconds }),
  ]

  return {
    cookieConfigs,
    cookieHeader: serializeCookieHeader(cookieConfigs),
    ...issuedSession,
  }
}

export async function createTrustedBrowserCookies({ browserId, fingerprint, userId }: TrustedBrowserCookieInput) {
  const token = await signTrustedBrowserToken({ browserId, fingerprint, userId })
  const cookieConfig = getTrustedBrowserCookieConfig(token)

  return {
    cookieConfigs: [cookieConfig],
    cookieHeader: serializeCookieHeader([cookieConfig]),
    token,
  }
}

export function expectAuthCookiesCleared(response: Response) {
  for (const name of ['at', 'rt', 'ah']) {
    expectCookieCleared(response, name)
  }
}

export function expectCookieCleared(response: Response, name: string) {
  const cookie = getSetCookieStrings(response).find(
    (value) => value.startsWith(`${name}=`) && value.includes('Max-Age=0'),
  )

  expect(cookie).toBeDefined()
  expect(cookie).toContain(`${name}=;`)
  expect(cookie).toContain('Max-Age=0')
}

export function expectPersistentCookie(response: Response, name: string) {
  const cookie = getSetCookieStrings(response).find((value) => value.startsWith(`${name}=`))

  expect(cookie).toBeDefined()
  expect(cookie).toContain('Max-Age=')
}

export function expectSessionCookie(response: Response, name: string) {
  const cookie = getSetCookieStrings(response).find((value) => value.startsWith(`${name}=`))

  expect(cookie).toBeDefined()
  expect(cookie).not.toContain('Max-Age=')
  expect(cookie).not.toContain('Expires=')
}

export function getTestPasswordHash(password: string = TEST_LOGIN_PASSWORD) {
  const cached = passwordHashCache.get(password)

  if (cached) {
    return cached
  }

  const next = hash(password, 10)
  passwordHashCache.set(password, next)
  return next
}

export function serializeCookieHeader(cookieConfigs: readonly Pick<AuthCookieConfig, 'key' | 'value'>[]) {
  return cookieConfigs.map((cookie) => `${cookie.key}=${cookie.value}`).join('; ')
}
