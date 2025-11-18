import { fetchMangasFromMultiSources } from '@/common/manga'
import { BLACKLISTED_MANGA_IDS, MAX_THUMBNAIL_IMAGES } from '@/constants/policy'
import { createCacheControl, createCacheControlHeaders, handleRouteError } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { Manga, MangaError } from '@/types/manga'
import { calculateOptimalCacheDuration } from '@/utils/cache-control'
import { sec } from '@/utils/date'
import { checkDefined } from '@/utils/type'

import { GETProxyIdSchema } from './schema'

export const runtime = 'edge'

export type GETProxyMangaResponse = Record<number, Manga | MangaError | null>

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyIdSchema.safeParse({
    ids: searchParams.getAll('id'),
    locale: searchParams.get('locale') ?? Locale.KO,
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { ids, locale } = validation.data
  const uniqueIds = Array.from(new Set(ids))
  const blacklistedIds = uniqueIds.filter((id) => BLACKLISTED_MANGA_IDS.includes(id))
  const validIds = uniqueIds.filter((id) => !BLACKLISTED_MANGA_IDS.includes(id))

  try {
    if (request.signal?.aborted) {
      return new Response('Client Closed Request', { status: 499 })
    }

    const fetchedMangas = await fetchMangasFromMultiSources({ ids: validIds, locale })
    const mangaMap: GETProxyMangaResponse = { ...fetchedMangas }
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
        manga.images = manga.images?.slice(0, MAX_THUMBNAIL_IMAGES)
      }
    }

    for (const id of blacklistedIds) {
      mangaMap[id] = {
        id,
        title: '감상이 제한된 작품이에요',
        images: [],
      }
    }

    const hasErrorManga = mangas.some((manga) => 'isError' in manga)
    const allImages = mangas.flatMap((manga) => manga.images).filter(checkDefined)

    const headers = (() => {
      if (hasErrorManga) {
        return createCacheControlHeaders({
          vercel: {
            maxAge: sec('10 seconds'),
          },
          browser: {
            public: true,
            maxAge: 3,
            sMaxAge: sec('30 seconds'),
            swr: sec('10 seconds'),
          },
        })
      }

      if (allImages.length === 0) {
        return createCacheControlHeaders({
          vercel: {
            maxAge: sec('30 days'),
          },
          browser: {
            public: true,
            maxAge: 3,
            sMaxAge: sec('30 days'),
            swr: sec('10 minutes'),
          },
        })
      }

      const allImageURLs = allImages.map((image) => image.original?.url ?? image.thumbnail?.url).filter(checkDefined)
      const optimalCacheDuration = calculateOptimalCacheDuration(allImageURLs)
      const swr = Math.floor(optimalCacheDuration * 0.01)

      return createCacheControlHeaders({
        cloudflare: {
          maxAge: optimalCacheDuration - swr,
          swr,
        },
        browser: {
          public: true,
          maxAge: 3,
        },
      })
    })()

    return Response.json(mangaMap satisfies GETProxyMangaResponse, { headers })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
