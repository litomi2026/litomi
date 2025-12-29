import { hentaiPawClient } from '@/crawler/hentai-paw'
import { createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/date'

import { GETProxyHentaiPawIdSchema } from './schema'

export const runtime = 'edge'
const maxAge = sec('12 hours')

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const validation = GETProxyHentaiPawIdSchema.safeParse(await params)

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
    })
  }

  const { id } = validation.data

  try {
    const manga = await hentaiPawClient.fetchManga({ id })

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
