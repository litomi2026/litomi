import { RequestCookies, ResponseCookies } from 'next/dist/server/web/spec-extension/cookies'
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
    const response = NextResponse.next()
    response.cookies.delete(CookieKey.REFRESH_TOKEN)
    return response
  }

  const response = NextResponse.next()
  await setAccessTokenCookie(response.cookies, userId)
  applySetCookieToOriginalRequest(request, response)
  return response
}

// https://github.com/vercel/next.js/discussions/50374
function applySetCookieToOriginalRequest(req: NextRequest, res: NextResponse) {
  const setCookies = new ResponseCookies(res.headers)
  const newReqHeaders = new Headers(req.headers)
  const newReqCookies = new RequestCookies(newReqHeaders)
  setCookies.getAll().forEach((cookie) => newReqCookies.set(cookie))
  const dummyRes = NextResponse.next({ request: { headers: newReqHeaders } })

  dummyRes.headers.forEach((value, key) => {
    if (key === 'x-middleware-override-headers' || key.startsWith('x-middleware-request-')) {
      res.headers.set(key, value)
    }
  })
}

// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/api/:path*', '/@(.*)'],
}
