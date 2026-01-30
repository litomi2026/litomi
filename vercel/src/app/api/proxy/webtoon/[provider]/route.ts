import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { WebtoonList } from '@/crawler/webtoon/types'
import { env } from '@/env/client'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/format/date'

import { fetchWebtoonList, isValidProvider } from '../providers'

export const runtime = 'edge'

const { NEXT_PUBLIC_CANONICAL_URL } = env

const PAGE_SIZE = 50

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
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const startIndex = cursor ? parseInt(cursor, 10) : 0

  if (request.signal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
    })
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }

  try {
    const fullList = await fetchWebtoonList(provider, searchParams)
    const endIndex = startIndex + PAGE_SIZE
    const paginatedItems = fullList.items.slice(startIndex, endIndex)
    const hasMore = endIndex < fullList.items.length

    const paginatedList: WebtoonList = {
      items: paginatedItems,
      nextCursor: hasMore ? String(endIndex) : undefined,
    }

    const headers = new Headers(
      createCacheControlHeaders({
        vercel: {
          maxAge: sec('30 days'),
        },
        browser: {
          public: true,
          maxAge: sec('10 minutes'),
          sMaxAge: sec('1 day'),
          swr: sec('1 day'),
        },
      }),
    )
    headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)

    return Response.json(paginatedList, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }
}
