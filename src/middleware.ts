import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { setAccessTokenCookie } from './utils/cookie'
import { TokenType, verifyJWT } from './utils/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (
    method === 'GET' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/library') &&
    !pathname.startsWith('/notification') &&
    !pathname.startsWith('/@')
  ) {
    return NextResponse.next()
  }

  const { cookies } = request
  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)?.value
  const validAT = await verifyJWT(accessToken ?? '', TokenType.ACCESS).catch(() => null)

  // 로그인 상태 -> 통과
  if (validAT) {
    return NextResponse.next()
  }

  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)?.value

  // at만 있는데 at가 만료된 경우 -> 쿠키 삭제
  if (!refreshToken) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    return response
  }

  const validRT = await verifyJWT(refreshToken, TokenType.REFRESH).catch(() => null)
  const userId = validRT?.sub

  // at가 만료됐는데 rt도 만료된 경우 -> 쿠키 삭제
  if (!userId) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    return response
  }

  // at가 만료됐는데 rt는 유효한 경우 -> at 재발급
  const response = NextResponse.next()
  await setAccessTokenCookie(response.cookies, userId)
  return response
}

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  matcher: [
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'rt' }],
    },
    {
      source: '/((?!.*\\.|_next/static|_next/image).*)',
      has: [{ type: 'cookie', key: 'at' }],
    },
  ],
}
