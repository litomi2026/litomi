import { kHentaiClient } from '@/crawler/k-hentai'
import { createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { RouteProps } from '@/types/nextjs'
import { createCacheControl } from '@/utils/cache-control'

import { GETProxyKIdSchema } from './schema'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const validation = GETProxyKIdSchema.safeParse(await params)

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
    })
  }

  const { id } = validation.data

  try {
    const manga = await kHentaiClient.fetchManga({ id, locale: Locale.KO })

    if (!manga) {
      return createProblemDetailsResponse(request, {
        status: 404,
        code: 'not-found',
        detail: '요청하신 작품을 찾을 수 없어요',
      })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          swr: maxAge,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
