import ms from 'ms'
import { unstable_cache } from 'next/cache'

import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { getCategories, KHentaiClient, KHentaiMangaSearchOptions } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga } from '@/types/manga'

import { convertQueryKey, filterMangasByMinusPrefix } from './utils'

export const runtime = 'edge'
const revalidate = ms('5 minutes') / 1000

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
    from,
    to,
    'next-id': nextId,
    skip,
  } = validation.data

  const lowerQuery = convertQueryKey(query?.toLowerCase())
  const categories = getCategories(lowerQuery)
  const search = lowerQuery?.replace(/\btype:\S+/gi, '').trim()

  try {
    const searchedMangas = await searchCachedMangas({
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
    })

    const mangas = filterMangasByMinusPrefix(searchedMangas, query)
    const nextCursor = mangas.length > 0 ? mangas[mangas.length - 1].id.toString() : null
    const hasNextPage = mangas.length > 0
    const response: GETProxyKSearchResponse = { mangas, nextCursor, hasNextPage }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: revalidate,
      sMaxAge: revalidate,
      staleWhileRevalidate: revalidate,
    })

    return Response.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

// TODO: 추후 'use cache' 로 변경하고 searchCachedMangas 함수 제거하기
const searchCachedMangas = unstable_cache(
  async (params: KHentaiMangaSearchOptions) => KHentaiClient.getInstance().searchMangas(params),
  ['searchCachedMangas'],
  { revalidate },
)
