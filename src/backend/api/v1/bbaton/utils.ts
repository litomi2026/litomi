import type { JWTPayload } from 'jose'

import { jwtVerify, SignJWT } from 'jose'

import { CookieKey } from '@/constants/storage'
import 'server-only'

import { env as commonEnv } from '@/env/server.common'
import { env } from '@/env/server.hono'
import { sec } from '@/utils/format/date'

const { APP_ORIGIN } = commonEnv
const { BBATON_CLIENT_ID, JWT_SECRET_BBATON_ATTEMPT } = env

type BBatonAttemptTokenPayload = JWTPayload & {
  userId: string
}

export const BBATON_ATTEMPT_TTL_SECONDS = sec('10 minutes')

const issuer = new URL(APP_ORIGIN).hostname

export function buildAuthorizeUrl(): string {
  const redirectURI = getBBatonRedirectURI()
  const authorizeUrl = new URL('https://bauth.bbaton.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', BBATON_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectURI)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read_profile')
  return authorizeUrl.toString()
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', APP_ORIGIN)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function signBBatonAttemptToken(userId: number): Promise<string> {
  const payload: BBatonAttemptTokenPayload = {
    userId: String(userId),
    jti: generateAttemptId(),
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: CookieKey.BBATON_ATTEMPT_ID })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + BBATON_ATTEMPT_TTL_SECONDS)
    .sign(new TextEncoder().encode(JWT_SECRET_BBATON_ATTEMPT))
}

export async function verifyBBatonAttemptToken(token: string) {
  try {
    const key = new TextEncoder().encode(JWT_SECRET_BBATON_ATTEMPT)

    const options = {
      algorithms: ['HS256'],
      issuer,
      typ: CookieKey.BBATON_ATTEMPT_ID,
    }

    const { payload } = await jwtVerify<BBatonAttemptTokenPayload>(token, key, options)
    const userId = Number.parseInt(payload.userId, 10)

    if (!Number.isFinite(userId)) {
      return null
    }

    const issuedAt = typeof payload.iat === 'number' ? payload.iat : null
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : null

    if (!issuedAt || !expiresAt) {
      return null
    }

    return { userId, issuedAt, expiresAt }
  } catch {
    return null
  }
}

function generateAttemptId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
