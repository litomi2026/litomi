import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { getCategories, KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga } from '@/types/manga'

import { convertQueryKey, filterMangasByMinusPrefix } from './utils'

export const runtime = 'edge'
const maxAge = 300

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
    return new Response('400 Bad Request', { status: 400 })
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
  const client = KHentaiClient.getInstance()

  try {
    const searchedMangas = await client.searchMangas({
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

    return Response.json(
      {
        mangas,
        nextCursor: mangas.length > 0 ? mangas[mangas.length - 1].id.toString() : null,
        hasNextPage: mangas.length > 0,
      } satisfies GETProxyKSearchResponse,
      {
        headers: {
          'Cache-Control': createCacheControl({
            public: true,
            maxAge,
            sMaxAge: maxAge,
            staleWhileRevalidate: maxAge,
          }),
        },
      },
    )
  } catch (error) {
    return handleRouteError(error, request)
  }
}
