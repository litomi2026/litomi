import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { WebtoonList } from '@/crawler/webtoon/types'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { fetchWebtoonList, isValidProvider } from '../providers'

export const runtime = 'edge'

const PAGE_SIZE = 50

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
  const cursor = searchParams.get('cursor')
  const startIndex = cursor ? parseInt(cursor, 10) : 0

  try {
    if (request.signal?.aborted) {
      return createProblemDetailsResponse(request, {
        status: 499,
        code: 'client-closed-request',
        detail: '요청이 취소됐어요',
      })
    }

    const fullList = await fetchWebtoonList(provider, searchParams)
    const endIndex = startIndex + PAGE_SIZE
    const paginatedItems = fullList.items.slice(startIndex, endIndex)
    const hasMore = endIndex < fullList.items.length

    const paginatedList: WebtoonList = {
      items: paginatedItems,
      nextCursor: hasMore ? String(endIndex) : undefined,
    }

    const headers = createCacheControlHeaders({
      vercel: {
        maxAge: sec('30 days'),
      },
      browser: {
        public: true,
        maxAge: sec('10 minutes'),
        sMaxAge: sec('1 day'),
        swr: sec('1 day'),
      },
    })

    return Response.json(paginatedList, { headers })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
