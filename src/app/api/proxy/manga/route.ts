import { fetchMangasFromMultiSources } from '@/common/manga'
import { BLACKLISTED_MANGA_IDS, MAX_THUMBNAIL_IMAGES } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga, MangaError } from '@/types/manga'
import { calculateOptimalCacheDuration } from '@/utils/cache-control'
import { sec } from '@/utils/date'

import { GETProxyIdSchema } from './schema'

export const runtime = 'edge'

export type GETProxyMangaResponse = Record<number, Manga | MangaError | null>

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const validation = GETProxyIdSchema.safeParse({ ids: searchParams.getAll('id') })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { ids } = validation.data
  const uniqueIds = Array.from(new Set(ids))
  const blacklistedIds = uniqueIds.filter((id) => BLACKLISTED_MANGA_IDS.includes(id))
  const validIds = uniqueIds.filter((id) => !BLACKLISTED_MANGA_IDS.includes(id))

  try {
    const fetchedMangas = await fetchMangasFromMultiSources(validIds)
    const mangaMap: GETProxyMangaResponse = { ...fetchedMangas }

    for (const id of blacklistedIds) {
      mangaMap[id] = null
    }

    const mangas = Object.values(fetchedMangas)

    if (mangas.length === 0 && blacklistedIds.length === 0) {
      const notFoundHeaders = {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: sec('1 hour'),
          sMaxAge: sec('1 hour'),
        }),
      }

      return new Response('Not Found', { status: 404, headers: notFoundHeaders })
    }

    for (const id of validIds) {
      const manga = mangaMap[id]
      if (manga) {
        manga.images = manga.images.slice(0, MAX_THUMBNAIL_IMAGES)
      }
    }

    const allImages = mangas.flatMap((manga) => manga.images)
    const hasErrorManga = mangas.some((manga) => 'isError' in manga)

    const headers = (() => {
      if (hasErrorManga) {
        return {
          'Cache-Control': createCacheControl({
            public: true,
            maxAge: sec('30 seconds'),
            sMaxAge: sec('10 seconds'),
            swr: sec('20 seconds'),
          }),
        }
      }

      if (allImages.length === 0) {
        return {
          'Cache-Control': createCacheControl({
            public: true,
            maxAge: sec('30 days'),
            sMaxAge: sec('30 days'),
            swr: sec('30 days'),
          }),
        }
      }

      const optimalCacheDuration = calculateOptimalCacheDuration(allImages)
      const cloudflareDuration = Math.floor(optimalCacheDuration * 0.9)
      const vercelDuration = Math.floor(optimalCacheDuration * 0.05)
      const browserDuration = optimalCacheDuration - cloudflareDuration - vercelDuration
      const swrDuration = Math.floor(Math.min(cloudflareDuration, vercelDuration, browserDuration) * 0.1)

      return {
        'Vercel-CDN-Cache-Control': createCacheControl({
          maxAge: vercelDuration - swrDuration,
          swr: swrDuration,
        }),
        'Cloudflare-Cache-Control': createCacheControl({
          maxAge: cloudflareDuration - swrDuration,
          swr: swrDuration,
        }),
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: browserDuration - swrDuration,
          swr: swrDuration,
        }),
      } as HeadersInit
    })()

    return Response.json(mangaMap satisfies GETProxyMangaResponse, { headers })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
