import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { MAX_KHENTAI_SEARCH_QUERY_LENGTH } from '@/constants/policy'
import { getCategories, KHentaiClient, KHentaiMangaSearchOptions } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { trendingKeywordsRedisService } from '@/services/TrendingKeywordsRedisService'
import { Manga } from '@/types/manga'
import { sec } from '@/utils/date'
import { chance } from '@/utils/random'

import { convertQueryKey, filterMangasByMinusPrefix } from './utils'

export const runtime = 'edge'

export type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
  hasNextPage: boolean
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
    uploader: uploaderMatch?.[1]?.replace(/_/g, ' '),
  }

  try {
    const revalidate = params.nextId ? sec('1 day') : 0
    const searchedMangas = await KHentaiClient.getInstance().searchMangas(params, revalidate)
    const mangas = filterMangasByMinusPrefix(searchedMangas, query)
    const hasNextPage = mangas.length > 0
    const nextCursor = hasNextPage ? mangas[mangas.length - 1].id.toString() : null
    const response: GETProxyKSearchResponse = { mangas, nextCursor, hasNextPage }

    const hasOtherFilters =
      sort || minView || maxView || minPage || maxPage || minRating || maxRating || from || to || nextId || skip

    if (query && !hasOtherFilters && mangas.length > 0) {
      if (chance(0.1)) {
        trendingKeywordsRedisService.trackSearch(query).catch(console.error)
      }
    }

    return Response.json(response, { headers: { 'Cache-Control': getCacheControl(params) } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function getCacheControl(params: KHentaiMangaSearchOptions) {
  const { nextId, sort } = params

  if (sort === 'random') {
    return createCacheControl({
      public: true,
      maxAge: sec('30 seconds'),
      sMaxAge: sec('30 seconds'),
      swr: sec('5 seconds'),
    })
  }

  if (nextId) {
    return createCacheControl({
      public: true,
      maxAge: sec('1 week'),
      sMaxAge: sec('1 week'), // NOTE: 캐시 메모리 용량당 과금 있으면 1 week -> 1 day 바꾸기
      swr: sec('5 minutes'),
    })
  }

  return createCacheControl({
    public: true,
    maxAge: sec('1 hour'),
    sMaxAge: sec('1 hour'),
    swr: sec('5 minutes'),
  })
}
