import type { JWTPayload } from 'jose'

import { jwtVerify, SignJWT } from 'jose'

import { CANONICAL_URL } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { env } from '@/env/server.common'
import { sec } from '@/utils/format/date'

type PointsTurnstileTokenPayload = JWTPayload & {
  userId: string
}

const { JWT_SECRET_TRUSTED_DEVICE } = env
const issuer = new URL(CANONICAL_URL).hostname
export const POINTS_TURNSTILE_TTL_SECONDS = sec('2 minutes')

export async function signPointsTurnstileToken(userId: number): Promise<string> {
  const payload: PointsTurnstileTokenPayload = {
    userId: String(userId),
    jti: crypto.randomUUID(),
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: CookieKey.POINTS_TURNSTILE })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + POINTS_TURNSTILE_TTL_SECONDS)
    .sign(new TextEncoder().encode(JWT_SECRET_TRUSTED_DEVICE))
}

export async function verifyPointsTurnstileToken(token: string): Promise<{ userId: number; expiresAt: Date } | null> {
  try {
    const { payload } = await jwtVerify<PointsTurnstileTokenPayload>(
      token,
      new TextEncoder().encode(JWT_SECRET_TRUSTED_DEVICE),
      {
        algorithms: ['HS256'],
        issuer,
        typ: CookieKey.POINTS_TURNSTILE,
      },
    )

    const userId = Number.parseInt(payload.userId, 10)

    if (!Number.isFinite(userId) || !payload.exp) {
      return null
    }

    return {
      userId,
      expiresAt: new Date(payload.exp * 1000),
    }
  } catch {
    return null
  }
}
