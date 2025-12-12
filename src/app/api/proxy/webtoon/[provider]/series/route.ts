import { createCacheControlHeaders, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { fetchWebtoonSeries, isValidProvider } from '../../providers'

export const runtime = 'edge'

type Params = {
  provider: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { provider } = await params

  if (!isValidProvider(provider)) {
    return new Response('Unknown provider', { status: 400 })
  }

  const { searchParams } = new URL(request.url)

  try {
    if (request.signal?.aborted) {
      return new Response('Client Closed Request', { status: 499 })
    }

    const series = await fetchWebtoonSeries(provider, searchParams)

    const headers = createCacheControlHeaders({
      vercel: {
        maxAge: sec('1 hour'),
      },
      browser: {
        public: true,
        maxAge: sec('5 minutes'),
        sMaxAge: sec('1 hour'),
        swr: sec('10 minutes'),
      },
    })

    return Response.json(series, { headers })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
