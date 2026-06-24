import { getPathLengthBlockStatus } from '@litomi/std'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export const config = {
  // DOCS: The matcher values need to be constants so they can be statically analyzed at build-time
  // https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files
  matcher: [
    { source: '/((?:[a-z]{2}(?:-[A-Za-z0-9]+)*/)?@.*)' },
    {
      source:
        '/((?!api(?:/|$)|health(?:/|$)|oauth(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|cdn-cgi(?:/|$)|\\.well-known(?:/|$)|image(?:/|$)|vvs83w(?:/|$)|.*\\..*).*)',
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
