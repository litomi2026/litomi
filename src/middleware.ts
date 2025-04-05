import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { setAccessTokenCookie } from './utils/cookie'
import { TokenType, verifyJWT } from './utils/jwt'

export async function middleware(request: NextRequest) {
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
  matcher: ['/api/:path*', '/notification/:path*', '/post/:path*', '/posts/:path*', '/@:path*'],
}
