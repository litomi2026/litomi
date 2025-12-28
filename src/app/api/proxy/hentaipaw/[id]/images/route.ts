import { hentaiPawClient } from '@/crawler/hentai-paw'
import { createCacheControl, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { sec } from '@/utils/date'

import { GETProxyHentaiPawImagesSchema } from './schema'

export const runtime = 'edge'
const maxAge = sec('12 hours')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyHentaiPawImagesSchema.safeParse({
    id: searchParams.get('id'),
  })

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
    })
  }

  const { id } = validation.data

  try {
    const images = await hentaiPawClient.fetchMangaImages({ id })

    return Response.json(images, {
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
