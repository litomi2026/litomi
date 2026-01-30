import { applyCORSHeaders, createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/format/date'

import { fetchWebtoonSeries, isValidProvider } from '../../providers'

export const runtime = 'edge'

type Params = {
  provider: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { provider } = await params

  if (!isValidProvider(provider)) {
    const response = createProblemDetailsResponse(request, {
      status: 400,
      code: 'unknown-provider',
      detail: '지원하지 않는 제공자예요',
    })
    applyCORSHeaders(request, response.headers)
    return response
  }

  const { searchParams } = new URL(request.url)

  try {
    if (request.signal?.aborted) {
      const response = createProblemDetailsResponse(request, {
        status: 499,
        code: 'client-closed-request',
        detail: '요청이 취소됐어요',
      })
      applyCORSHeaders(request, response.headers)
      return response
    }

    const series = await fetchWebtoonSeries(provider, searchParams)

    const headers = new Headers(
      createCacheControlHeaders({
      vercel: {
        maxAge: sec('1 hour'),
      },
      browser: {
        public: true,
        maxAge: sec('5 minutes'),
        sMaxAge: sec('1 hour'),
        swr: sec('10 minutes'),
      },
      }),
    )
    applyCORSHeaders(request, headers)

    return Response.json(series, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    applyCORSHeaders(request, response.headers)
    return response
  }
}
