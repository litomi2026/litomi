import type { JWTPayload } from 'jose'

import { jwtVerify, SignJWT } from 'jose'

import { env } from '@/backend/env'
import { CookieKey } from '@/constants/storage'
import { sec } from '@/utils/date'

const { BBATON_CLIENT_ID, JWT_SECRET_BBATON_ATTEMPT, CORS_ORIGIN } = env

type BBatonAttemptTokenPayload = JWTPayload & {
  userId: string
}

export const BBATON_ATTEMPT_TTL_SECONDS = sec('10 minutes')

export function buildAuthorizeUrl(): string {
  const redirectURI = getBBatonRedirectURI()
  const authorizeUrl = new URL('https://bauth.bbaton.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', BBATON_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectURI)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read_profile')
  return authorizeUrl.toString()
}

export function generateAttemptId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', CORS_ORIGIN)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const issuer = new URL(CORS_ORIGIN).hostname

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

export async function verifyBBatonAttemptToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify<BBatonAttemptTokenPayload>(
      token,
      new TextEncoder().encode(JWT_SECRET_BBATON_ATTEMPT),
      {
        algorithms: ['HS256'],
        issuer,
        typ: CookieKey.BBATON_ATTEMPT_ID,
      },
    )

    const userId = Number.parseInt(payload.userId, 10)
    if (!Number.isFinite(userId)) {
      return null
    }

    return { userId }
  } catch {
    return null
  }
}
