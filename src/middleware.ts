import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { setAccessTokenCookie } from './utils/cookie'
import { TokenType, verifyJWT } from './utils/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next')) return NextResponse.next()

  const { cookies } = request
  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)
  if (accessToken) return NextResponse.next()

  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)
  if (!refreshToken) return NextResponse.next()

  const { sub: userId } = await verifyJWT(refreshToken.value, TokenType.REFRESH).catch(() => ({ sub: null }))

  if (!userId) {
    cookies.delete(CookieKey.REFRESH_TOKEN)
    return NextResponse.next()
  }

  const response = NextResponse.next()
  await setAccessTokenCookie(response.cookies, userId)

  return response
}

// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
