import { NextRequest } from 'next/server'

import { convertQueryKey } from '@/app/(navigation)/search/utils'
import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { getCategories, KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga } from '@/types/manga'

export const runtime = 'edge'
export const revalidate = 300

export type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
  hasNextPage: boolean
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const params = Object.fromEntries(searchParams)
  const validation = GETProxyKSearchSchema.safeParse(params)

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
    const params = {
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

    const mangas = await client.searchMangas(params, revalidate)

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
            sMaxAge: revalidate,
            staleWhileRevalidate: 2 * revalidate,
          }),
        },
      },
    )
  } catch (error) {
    return handleRouteError(error, request)
  }
}
