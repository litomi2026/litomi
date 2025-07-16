import { RequestCookies, ResponseCookies } from 'next/dist/server/web/spec-extension/cookies'
import { NextRequest, NextResponse } from 'next/server'

import { CookieKey } from './constants/storage'
import { setAccessTokenCookie } from './utils/cookie'
import { TokenType, verifyJWT } from './utils/jwt'

export async function middleware(request: NextRequest) {
  const { cookies } = request
  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)?.value
  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)?.value

  // 비로그인 상태 -> 통과
  if (!accessToken && !refreshToken) return NextResponse.next()

  const validAT = await verifyJWT(accessToken ?? '', TokenType.ACCESS).catch(() => null)

  // 로그인 상태 -> 통과
  if (validAT) return NextResponse.next()

  // at만 있는데 at가 만료된 경우 -> 쿠키 삭제
  if (!refreshToken) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    return response
  }

  const validRT = await verifyJWT(refreshToken, TokenType.REFRESH).catch(() => null)

  // at가 만료됐는데 rt도 만료된 경우 -> 쿠키 삭제
  if (!validRT || !validRT.sub) {
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.ACCESS_TOKEN)
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    return response
  }

  // at가 만료됐는데 rt는 유효한 경우 -> at 재발급
  const response = NextResponse.next()
  // TODO(2025-07-16): 30일 후 Optional chaining 삭제하기
  await setAccessTokenCookie(response.cookies, validRT.sub, validRT.loginId ?? '')
  setCookieToRequest(request, response)
  return response
}

// https://github.com/vercel/next.js/discussions/50374
function setCookieToRequest(req: NextRequest, res: NextResponse) {
  const setCookies = new ResponseCookies(res.headers)
  const newReqHeaders = new Headers(req.headers)
  const newReqCookies = new RequestCookies(newReqHeaders)
  setCookies.getAll().forEach((cookie) => newReqCookies.set(cookie))

  NextResponse.next({ request: { headers: newReqHeaders } }).headers.forEach((value, key) => {
    if (key === 'x-middleware-override-headers' || key.startsWith('x-middleware-request-')) {
      res.headers.set(key, value)
    }
  })
}

// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/api/:path*', '/@(.*)'],
}
