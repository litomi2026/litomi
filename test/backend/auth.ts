import { hash } from 'bcryptjs'

import { issuePersistentSession } from '@/common/session'
import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@/utils/cookie'

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
