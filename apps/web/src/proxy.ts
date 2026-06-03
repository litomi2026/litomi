import { getPathLengthBlockStatus } from '@litomi/std'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  // DOCS: Ignoring matching prefetches
  // https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-proxy
  matcher: [
    {
      source:
        '/((?!_next/static/|_next/image|api/|oauth/bbaton/callback|cdn-cgi/challenge-platform/|\\.well-known/|image/|favicon\\.ico$|icon\\.png$|apple-icon\\.png$|manifest\\.webmanifest$|robots\\.txt$|sitemap\\.xml$|sw\\.js$|ads\\.txt$|og-image\\.avif$|og-image\\.webp$|web-app-manifest-144x144\\.png$|web-app-manifest-192x192\\.png$|web-app-manifest-512x512\\.png$).*)',
    },
  ],
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request
  const pathLengthBlockStatus = getPathLengthBlockStatus(nextUrl.pathname)

  if (pathLengthBlockStatus) {
    return new NextResponse(null, { status: pathLengthBlockStatus })
  }

  return handleI18nRouting(request)
}
