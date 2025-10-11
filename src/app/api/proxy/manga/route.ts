import { fetchMangasFromMultiSources } from '@/common/manga'
import { MAX_THUMBNAIL_IMAGES } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga, MangaError } from '@/types/manga'
import { sec } from '@/utils/date'

import { GETProxyIdSchema, ProxyIdOnly } from './schema'

export const runtime = 'edge'

export type GETProxyMangaResponse = Record<number, Manga | MangaError>

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyIdSchema.safeParse({
    ids: searchParams.getAll('id'),
    only: searchParams.get('only'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { ids, only } = validation.data
  const uniqueIds = Array.from(new Set(ids))

  try {
    const mangas = await fetchMangasFromMultiSources(uniqueIds)

    if (Object.keys(mangas).length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    if (only === ProxyIdOnly.THUMBNAIL) {
      for (const id of uniqueIds) {
        mangas[id].images = mangas[id].images.slice(0, MAX_THUMBNAIL_IMAGES)
      }
    }

    const successHeaders = {
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('10 hours'),
        sMaxAge: sec('1 hour'),
        swr: sec('1 hour'),
      }),
    }

    return Response.json(mangas satisfies GETProxyMangaResponse, { headers: successHeaders })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
