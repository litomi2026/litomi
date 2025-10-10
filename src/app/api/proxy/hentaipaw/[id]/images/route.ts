import { hentaiPawClient } from '@/crawler/hentai-paw'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

import { GETProxyHentaiPawImagesSchema } from './schema'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyHentaiPawImagesSchema.safeParse({
    id: searchParams.get('id'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
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
