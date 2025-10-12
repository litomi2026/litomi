import { fetchMangasFromMultiSources } from '@/common/manga'
import { BLACKLISTED_MANGA_IDS, MAX_THUMBNAIL_IMAGES } from '@/constants/policy'
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
  const uniqueIds = Array.from(new Set(ids.filter((id) => !BLACKLISTED_MANGA_IDS.includes(id))))

  try {
    const mangaMap = await fetchMangasFromMultiSources(uniqueIds)
    const mangas = Object.values(mangaMap)

    if (mangas.length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    if (only === ProxyIdOnly.THUMBNAIL) {
      for (const id of uniqueIds) {
        mangaMap[id].images = mangaMap[id].images.slice(0, MAX_THUMBNAIL_IMAGES)
      }
    }

    const hasErrorManga = mangas.some((manga) => 'isError' in manga && manga.isError)

    const cacheControl = hasErrorManga
      ? createCacheControl({
          public: true,
          maxAge: sec('30 seconds'),
          sMaxAge: sec('10 seconds'),
          swr: sec('20 seconds'),
        })
      : createCacheControl({
          public: true,
          maxAge: sec('10 hours'),
          sMaxAge: sec('1 hour'),
          swr: sec('1 hour'),
        })

    return Response.json(mangaMap satisfies GETProxyMangaResponse, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
