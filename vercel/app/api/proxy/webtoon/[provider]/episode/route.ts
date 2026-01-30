import {
  applyCORSHeaders,
  createCacheControlHeaders,
  createProblemDetailsResponse,
  handleRouteError,
} from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/format/date'

import { fetchWebtoonEpisode, isValidProvider } from '../../providers'

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

    const episode = await fetchWebtoonEpisode(provider, searchParams)

    const headers = new Headers(
      createCacheControlHeaders({
        vercel: {
          maxAge: sec('7 days'),
        },
        browser: {
          public: true,
          maxAge: sec('10 minutes'),
          sMaxAge: sec('7 days'),
          swr: sec('1 day'),
        },
      }),
    )
    applyCORSHeaders(request, headers)

    return Response.json(episode, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    applyCORSHeaders(request, response.headers)
    return response
  }
}
