import type { JWTPayload } from 'jose'

import { jwtVerify, SignJWT } from 'jose'

import { CANONICAL_URL } from '@/constants'
import { JWT_SECRET_ACCESS_TOKEN, JWT_SECRET_REFRESH_TOKEN, JWT_SECRET_TRUSTED_DEVICE } from '@/constants/env'

import { sec } from './date'

const url = new URL(CANONICAL_URL)

export enum TokenType {
  ACCESS,
  REFRESH,
  TRUSTED_DEVICE,
}

export async function signJWT(payload: JWTPayload, type: TokenType): Promise<string> {
  const { duration, secretKey } = getConfig(type)

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(url.hostname)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + duration)
    .sign(new TextEncoder().encode(secretKey))
}

function getConfig(type: TokenType) {
  // NOTE: https://developer.amazon.com/docs/login-with-amazon/access-token.html
  switch (type) {
    case TokenType.ACCESS:
      return {
        duration: sec('1 hour'),
        secretKey: JWT_SECRET_ACCESS_TOKEN,
      }
    case TokenType.REFRESH:
      return {
        duration: sec('30 days'),
        secretKey: JWT_SECRET_REFRESH_TOKEN,
      }
    case TokenType.TRUSTED_DEVICE:
      return {
        duration: sec('30 days'),
        secretKey: JWT_SECRET_TRUSTED_DEVICE,
      }
    default:
      throw new Error(`Unknown token type: ${type}`)
  }
}

const options = {
  algorithms: ['HS256'],
  issuer: url.hostname,
}

export async function verifyJWT(token: string, type: TokenType) {
  const { secretKey } = getConfig(type)
  const { payload } = await jwtVerify<JWTPayload>(token, new TextEncoder().encode(secretKey), options)
  return payload
}
