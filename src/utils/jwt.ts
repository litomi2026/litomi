import type { JWTPayload } from 'jose'

import { ONE_HOUR, THIRTY_DAYS } from '@/constants'
import { JWT_SECRET_ACCESS_TOKEN, JWT_SECRET_REFRESH_TOKEN } from '@/constants/env'
import { CANONICAL_URL } from '@/constants/url'
import { jwtVerify, SignJWT } from 'jose'

const url = new URL(CANONICAL_URL)

export enum TokenType {
  ACCESS,
  REFRESH,
}

export async function signJWT(payload: JWTPayload, type: TokenType): Promise<string> {
  // NOTE: https://developer.amazon.com/docs/login-with-amazon/access-token.html
  const duration = type === TokenType.ACCESS ? ONE_HOUR : THIRTY_DAYS
  const secretKey = type === TokenType.ACCESS ? JWT_SECRET_ACCESS_TOKEN : JWT_SECRET_REFRESH_TOKEN

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(url.hostname)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + duration)
    .sign(new TextEncoder().encode(secretKey))
}

const options = {
  algorithms: ['HS256'],
  issuer: url.hostname,
}

export async function verifyJWT(token: string, type: TokenType): Promise<JWTPayload> {
  const secretKey = type === TokenType.ACCESS ? JWT_SECRET_ACCESS_TOKEN : JWT_SECRET_REFRESH_TOKEN
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secretKey), options)
  return payload
}
