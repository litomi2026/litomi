import { NextRequest } from 'next/server'

import { MangaSearchSchema } from '@/app/(navigation)/search/schema'
import { convertQueryKey } from '@/app/(navigation)/search/utils'
import { getCategories, KHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
export const revalidate = 300

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const params = Object.fromEntries(searchParams)
  const validation = MangaSearchSchema.safeParse(params)

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
    const mangas = await client.searchMangas({
      search,
      nextId: nextId ? String(nextId) : undefined,
      sort,
      offset: skip ? String(skip) : undefined,
      categories,
      minViews: minView ? String(minView) : undefined,
      maxViews: maxView ? String(maxView) : undefined,
      minPages: minPage ? String(minPage) : undefined,
      maxPages: maxPage ? String(maxPage) : undefined,
      startDate: from ? String(from) : undefined,
      endDate: to ? String(to) : undefined,
    })

    return Response.json(mangas, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          sMaxAge: revalidate,
          staleWhileRevalidate: 2 * revalidate,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
