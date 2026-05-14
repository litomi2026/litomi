import { applyCookieConfigs, getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { JWTType, verifyJWT } from '@litomi/auth/jwt'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { refreshSession } from '@litomi/auth/session/persistent-session'
import { CookieKey } from '@litomi/domain/constants/storage'
import { getRequestUserAgent } from '@litomi/http/request'
import { getPathLengthBlockStatus } from '@litomi/std/path-length-guard'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  // DOCS: Ignoring matching prefetches
  // https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-proxy
  matcher: [
    {
      source:
        '/((?!_next/static/|_next/image|cdn-cgi/challenge-platform/|\\.well-known/|image/|favicon\\.ico$|icon\\.png$|apple-icon\\.png$|manifest\\.webmanifest$|robots\\.txt$|sitemap\\.xml$|sw\\.js$|ads\\.txt$|og-image\\.avif$|og-image\\.webp$|web-app-manifest-144x144\\.png$|web-app-manifest-192x192\\.png$|web-app-manifest-512x512\\.png$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

export async function proxy({ cookies, headers, nextUrl }: NextRequest) {
  const pathLengthBlockStatus = getPathLengthBlockStatus(nextUrl.pathname)

  if (pathLengthBlockStatus) {
    return new NextResponse(null, { status: pathLengthBlockStatus })
  }

  const accessToken = cookies.get(CookieKey.ACCESS_TOKEN)?.value
  const refreshToken = cookies.get(CookieKey.REFRESH_TOKEN)?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.next()
  }

  const validAccessToken = accessToken ? await verifyJWT(accessToken, JWTType.ACCESS).catch(() => null) : null

  if (validAccessToken) {
    return NextResponse.next()
  }

  if (!refreshToken) {
    const response = NextResponse.next()
    applyCookieConfigs(response.cookies, getAuthCookieClearConfigs())
    return response
  }

  const deviceLabel = buildSessionDeviceLabel(getRequestUserAgent(headers))
  const refreshResult = await refreshSession(refreshToken, deviceLabel)

  if (!refreshResult.ok) {
    const response = NextResponse.next()
    applyCookieConfigs(response.cookies, getAuthCookieClearConfigs())
    return response
  }

  const response = NextResponse.next()

  for (const cookie of refreshResult.cookies) {
    response.cookies.set(cookie.key, cookie.value, cookie.options)
  }

  return response
}
