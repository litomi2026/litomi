import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { refreshSession } from './query/session'
import { buildSessionDeviceLabel } from './query/session.util'
import { JWTType, verifyJWT } from './utils/jwt'
import { getRequestUserAgent } from './utils/request'

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  // DOCS: Ignoring matching prefetches
  // https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-proxy
  matcher: [
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'rt' }],
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'at' }],
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

export async function proxy({ cookies, headers }: NextRequest) {
  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)?.value
  const validAccessToken = await verifyJWT(accessToken ?? '', JWTType.ACCESS).catch(() => null)

  if (validAccessToken) {
    return NextResponse.next()
  }

  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)?.value

  if (!refreshToken) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    response.cookies.delete(CookieKey.AUTH_HINT)
    return response
  }

  const metadata = {
    deviceLabel: buildSessionDeviceLabel(getRequestUserAgent(headers)),
  }

  const refreshResult = await refreshSession(refreshToken, metadata)

  if (!refreshResult.ok) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    response.cookies.delete(CookieKey.AUTH_HINT)
    return response
  }

  const response = NextResponse.next()

  for (const cookie of refreshResult.cookies) {
    response.cookies.set(cookie.key, cookie.value, cookie.options)
  }

  return response
}
