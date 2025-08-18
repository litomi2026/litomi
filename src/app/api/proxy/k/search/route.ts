import ms from 'ms'

import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { getCategories, KHentaiClient, KHentaiMangaSearchOptions } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga } from '@/types/manga'

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
    from,
    to,
    'next-id': nextId,
    skip,
  } = validation.data

  const lowerQuery = convertQueryKey(query?.toLowerCase())
  const categories = getCategories(lowerQuery)
  const search = lowerQuery?.replace(/\btype:\S+/gi, '').trim()

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
  }

  try {
    const maxAge = params.nextId ? ms('1 day') / 1000 : ms('1 hour') / 1000
    const revalidate = params.nextId ? maxAge : 0
    const searchedMangas = await KHentaiClient.getInstance().searchMangas(params, revalidate)
    const mangas = filterMangasByMinusPrefix(searchedMangas, query)
    const nextCursor = mangas.length > 0 ? mangas[mangas.length - 1].id.toString() : null
    const hasNextPage = mangas.length > 0
    const response: GETProxyKSearchResponse = { mangas, nextCursor, hasNextPage }

    const cacheControl = createCacheControl({
      public: true,
      maxAge,
      sMaxAge: maxAge,
      staleWhileRevalidate: maxAge,
    })

    return Response.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
