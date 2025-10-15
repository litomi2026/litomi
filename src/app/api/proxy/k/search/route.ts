import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { BLACKLISTED_MANGA_IDS, MAX_KHENTAI_SEARCH_QUERY_LENGTH } from '@/constants/policy'
import { getCategories, kHentaiClient, KHentaiMangaSearchOptions } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { trendingKeywordsRedisService } from '@/services/TrendingKeywordsRedisService'
import { Manga } from '@/types/manga'
import { sec } from '@/utils/date'
import { chance } from '@/utils/random-edge'

import { convertQueryKey, filterMangasByMinusPrefix } from './utils'

export const runtime = 'edge'

export type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyKSearchSchema.safeParse(searchParams)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const {
    query,
    sort,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    'min-rating': minRating,
    'max-rating': maxRating,
    from,
    to,
    'next-id': nextId,
    'next-views': nextViews,
    'next-views-id': nextViewsId,
    skip,
  } = validation.data

  const uploaderMatch = query?.match(/\buploader:(\S+)/i)
  const lowerQuery = convertQueryKey(query?.toLowerCase())
  const categories = getCategories(lowerQuery)
  const search = lowerQuery?.replace(/\b(type|uploader):\S+/gi, '').trim()

  if (search && search.length > MAX_KHENTAI_SEARCH_QUERY_LENGTH) {
    return new Response('Bad Request', { status: 400 })
  }

  const params: KHentaiMangaSearchOptions = {
    search,
    nextId: nextId?.toString(),
    nextViews: nextViews?.toString(),
    nextViewsId: nextViewsId?.toString(),
    sort,
    offset: skip?.toString(),
    categories,
    minViews: minView?.toString(),
    maxViews: maxView?.toString(),
    minPages: minPage?.toString(),
    maxPages: maxPage?.toString(),
    startDate: from?.toString(),
    endDate: to?.toString(),
    minRating: minRating?.toString(),
    maxRating: maxRating?.toString(),
    uploader: uploaderMatch?.[1],
  }

  try {
    const revalidate = params.nextId ? sec('30 days') : 0
    const searchedMangas = await kHentaiClient.searchMangas(params, revalidate)
    const hasManga = searchedMangas.length > 0

    let nextCursor = null
    if (hasManga) {
      const lastManga = searchedMangas[searchedMangas.length - 1]
      if (sort === 'popular') {
        nextCursor = `${lastManga.viewCount}-${lastManga.id}`
      } else {
        nextCursor = lastManga.id.toString()
      }
    }

    const filteredMangas = searchedMangas.filter((manga) => !BLACKLISTED_MANGA_IDS.includes(manga.id))
    const mangas = filterMangasByMinusPrefix(filteredMangas, query)

    const response: GETProxyKSearchResponse = {
      mangas,
      nextCursor,
    }

    const hasOtherFilters =
      sort ||
      minView ||
      maxView ||
      minPage ||
      maxPage ||
      minRating ||
      maxRating ||
      from ||
      to ||
      nextId ||
      nextViews ||
      nextViewsId ||
      skip

    if (query && !hasOtherFilters && hasManga) {
      if (chance(0.1)) {
        trendingKeywordsRedisService.trackSearch(query).catch(console.error)
      }
    }

    return Response.json(response, { headers: getCacheControlHeader(params) })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function getCacheControlHeader(params: KHentaiMangaSearchOptions) {
  const { nextId, nextViews, sort } = params

  if (sort === 'random') {
    const swr = sec('5 seconds')
    return {
      'Vercel-CDN-Cache-Control': createCacheControl({
        maxAge: sec('5 seconds'),
        swr,
      }),
      'Cloudflare-Cache-Control': createCacheControl({
        maxAge: sec('30 seconds'),
        swr,
      }),
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('5 seconds'),
        swr,
      }),
    }
  }

  if (nextId) {
    const swr = sec('10 minutes')
    return {
      'Vercel-CDN-Cache-Control': createCacheControl({
        maxAge: sec('30 days'),
        swr,
      }),
      'Cloudflare-Cache-Control': createCacheControl({
        maxAge: sec('30 days'),
        swr,
      }),
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('10 minutes'),
        swr,
      }),
    }
  }

  if (nextViews) {
    const swr = sec('10 minutes')
    return {
      'Vercel-CDN-Cache-Control': createCacheControl({
        maxAge: sec('1 hour'),
        swr,
      }),
      'Cloudflare-Cache-Control': createCacheControl({
        maxAge: sec('1 day'),
        swr,
      }),
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('10 minutes'),
        swr,
      }),
    }
  }

  const swr = sec('10 minutes')

  return {
    'Vercel-CDN-Cache-Control': createCacheControl({
      maxAge: sec('10 minutes'),
      swr,
    }),
    'Cloudflare-Cache-Control': createCacheControl({
      maxAge: sec('1 hour'),
      swr,
    }),
    'Cache-Control': createCacheControl({
      public: true,
      maxAge: sec('5 minutes'),
      swr,
    }),
  }
}
