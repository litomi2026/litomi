import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@litomi/crawler/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { env } from '@litomi/env/client'
import { sec } from '@litomi/std'

import { fetchWebtoonSeries, isValidProvider } from '../../providers'

export const runtime = 'edge'

const { NEXT_PUBLIC_APP_ORIGIN } = env

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
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }

  if (request.signal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
    })
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }

  const { searchParams } = new URL(request.url)

  try {
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
    headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)

    return Response.json(series, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }
}
