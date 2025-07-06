import { captureException } from '@sentry/nextjs'
import { NextRequest } from 'next/server'

import { MangaSearchSchema } from '@/app/(navigation)/search/searchValidation'
import { convertQueryKey } from '@/app/(navigation)/search/utils'
import { convertKHentaiMangaToManga, getCategories, KHentaiManga } from '@/crawler/k-hentai'

export const runtime = 'edge'
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = Object.fromEntries(searchParams)
    const validationResult = MangaSearchSchema.safeParse(params)

    if (!validationResult.success) {
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
    } = validationResult.data

    const lowerQuery = convertQueryKey(query?.toLowerCase())
    const categories = getCategories(lowerQuery)
    const search = lowerQuery?.replace(/\btype:\S+/gi, '').trim()

    const kHentaiParams = {
      ...(search && { search }),
      ...(nextId && { 'next-id': nextId }),
      ...(sort && { sort }),
      ...(skip && { offset: String(skip) }),
      ...(categories && { categories }),
      ...(minView && { 'min-views': String(minView) }),
      ...(maxView && { 'max-views': String(maxView) }),
      ...(minPage && { 'min-pages': String(minPage) }),
      ...(maxPage && { 'max-pages': String(maxPage) }),
      ...(from && { 'start-date': String(from) }),
      ...(to && { 'end-date': String(to) }),
    }

    const response = await fetch(`https://k-hentai.org/ajax/search?${new URLSearchParams(kHentaiParams)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://k-hentai.org',
      },
      redirect: 'manual',
    })

    if (!response.ok) {
      captureException(new Error(`K-Hentai API returned ${response.status} ${response.statusText}`), {
        tags: {
          api: 'k-hentai',
          status: response.status,
        },
        extra: {
          searchParams: kHentaiParams,
          response,
        },
      })

      return new Response(`${response.status} ${response.statusText}`, { status: response.status })
    }

    const data = (await response.json()) as KHentaiManga[]
    const mangas = data.filter((manga) => manga.archived === 1).map((manga) => convertKHentaiMangaToManga(manga))

    return Response.json(mangas, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    captureException(error, {
      tags: {
        api: 'k-hentai',
        type: 'proxy_error',
      },
      extra: {
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    if (error instanceof Error && error.message.includes('fetch')) {
      return Response.json({ error: 'Network error accessing k-hentai.org' }, { status: 503 })
    }

    return Response.json({ error: 'Failed to fetch from k-hentai.org' }, { status: 500 })
  }
}
