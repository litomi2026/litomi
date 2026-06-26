import { JWTType, verifyJWT } from '@litomi/auth/jwt'
import { CookieKey } from '@litomi/http/cookie'
import { parseCookie } from 'cookie'
import type { JWTPayload } from 'jose'

export async function authenticateRequest(req: Request) {
  const token = readAccessToken(req)
  if (!token) {
    return null
  }

  try {
    const payload = await verifyJWT<JWTPayload>(token, JWTType.ACCESS)
    if (!payload.sub) {
      return null
    }

    const userId = Number(payload.sub)
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null
    }

    return { userId }
  } catch (error) {
    if (error instanceof Error && !error.name.startsWith('JW')) {
      console.error('Unexpected error during JWT verification:', error)
    }
    return null
  }
}

function readAccessToken(req: Request) {
  const match = req.headers.get('authorization')?.match(/^Bearer\s+(.*)$/i)

  if (match) {
    return match[1].trim()
  }

  return parseCookie(req.headers.get('cookie') ?? '')[CookieKey.ACCESS_TOKEN]
}
