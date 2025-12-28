import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
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
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'unknown-provider',
      detail: '지원하지 않는 제공자예요',
    })
  }

  const { searchParams } = new URL(request.url)

  try {
    if (request.signal?.aborted) {
      return createProblemDetailsResponse(request, {
        status: 499,
        code: 'client-closed-request',
        detail: '요청이 취소됐어요',
      })
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
