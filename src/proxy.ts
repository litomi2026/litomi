import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { getAccessTokenCookieConfig } from './utils/cookie'
import { JWTType, verifyJWT } from './utils/jwt'

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  // DOCS: Ignoring matching prefetches
  // https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-middleware
  matcher: [
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'rt' }],
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'at' }],
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
}

export async function proxy({ nextUrl, method, cookies }: NextRequest) {
  const { pathname } = nextUrl

  if (
    method === 'GET' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/library') &&
    !pathname.startsWith('/notification') &&
    !pathname.startsWith('/@')
  ) {
    return NextResponse.next()
  }

  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)?.value
  const validAccessToken = await verifyJWT(accessToken ?? '', JWTType.ACCESS).catch(() => null)

  // 로그인 -> 통과
  if (validAccessToken) {
    return NextResponse.next()
  }

  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)?.value

  // at 만료 및 rt 없음 -> at 쿠키 삭제
  if (!refreshToken) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    return response
  }

  const validRefreshToken = await verifyJWT(refreshToken, JWTType.REFRESH).catch(() => null)
  const userId = validRefreshToken?.sub
  const adult = validRefreshToken?.adult === true

  // at 만료 및 rt 만료 -> at, rt 쿠키 삭제
  if (!userId) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    return response
  }

  // at 만료 및 rt 유효 -> at 재발급
  const response = NextResponse.next()
  const { key, value, options } = await getAccessTokenCookieConfig({ userId, adult })
  response.cookies.set(key, value, options)
  return response
}
