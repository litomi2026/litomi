import type { JWTPayload } from 'jose'

import { jwtVerify, SignJWT } from 'jose'

import { CANONICAL_URL } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { env } from '@/env/server.next'

import { sec } from './date'

const { JWT_SECRET_ACCESS_TOKEN, JWT_SECRET_REFRESH_TOKEN, JWT_SECRET_TRUSTED_DEVICE } = env

const url = new URL(CANONICAL_URL)

export enum JWTType {
  ACCESS,
  REFRESH,
  TRUSTED_BROWSER,
}

export async function signJWT(payload: JWTPayload, type: JWTType): Promise<string> {
  const { duration, secretKey, typeName } = getConfig(type)

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: typeName })
    .setIssuer(url.hostname)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + duration)
    .sign(new TextEncoder().encode(secretKey))
}

export async function verifyJWT<T extends JWTPayload>(token: string, type: JWTType) {
  const { secretKey, typeName } = getConfig(type)

  const { payload } = await jwtVerify<T>(token, new TextEncoder().encode(secretKey), {
    algorithms: ['HS256'],
    issuer: url.hostname,
    typ: typeName,
  })

  return payload
}

function getConfig(type: JWTType) {
  // NOTE: https://developer.amazon.com/docs/login-with-amazon/access-token.html
  switch (type) {
    case JWTType.ACCESS:
      return {
        duration: sec('1 hour'),
        secretKey: JWT_SECRET_ACCESS_TOKEN,
        typeName: CookieKey.ACCESS_TOKEN,
      }
    case JWTType.REFRESH:
      return {
        duration: sec('30 days'),
        secretKey: JWT_SECRET_REFRESH_TOKEN,
        typeName: CookieKey.REFRESH_TOKEN,
      }
    case JWTType.TRUSTED_BROWSER:
      return {
        duration: sec('30 days'),
        secretKey: JWT_SECRET_TRUSTED_DEVICE,
        typeName: CookieKey.TRUSTED_BROWSER_TOKEN,
      }
    default:
      throw new Error(`Unknown token type: ${type}`)
  }
}
