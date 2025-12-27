import { waitUntil } from '@vercel/functions'

import { GETProxyKSearchSchema } from '@/app/api/proxy/k/search/schema'
import { POSTV1SearchTrendingBody } from '@/backend/api/v1/search/trending/POST'
import { BLACKLISTED_MANGA_IDS, MAX_KHENTAI_SEARCH_QUERY_LENGTH } from '@/constants/policy'
import { encodeCategories, kHentaiClient, KHentaiMangaSearchOptions } from '@/crawler/k-hentai'
import { createCacheControlHeaders, handleRouteError } from '@/crawler/proxy-utils'
import { env } from '@/env/client'
import { getKeywordPromotion, type KeywordPromotion } from '@/sponsor'
import { Locale } from '@/translation/common'
import { Manga } from '@/types/manga'
import { sec } from '@/utils/date'
import { chance } from '@/utils/random-edge'

import { convertToKHentaiKey, filterMangasByMinusPrefix } from './utils'

const { NEXT_PUBLIC_BACKEND_URL } = env

export const runtime = 'edge'

export type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
  promotion?: KeywordPromotion
}

export async function GET(request: Request) {
  const requestSignal = request.signal
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
    locale,
  } = validation.data

  const lowerQuery = convertToKHentaiKey(query?.toLowerCase())
  const baseSearch = lowerQuery?.replace(/\b(type|uploader):\S+/gi, '').trim() ?? ''
  const hasLanguageFilter = /\blanguage:\S+/i.test(baseSearch)
  const matchedCategories = query?.match(/\btype:(\S+)/i)
  const languageFilter = !hasLanguageFilter && locale ? getKHentaiLanguageFilter(locale) : ''
  const search = [languageFilter, baseSearch].filter(Boolean).join(' ')

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
    categories: matchedCategories ? encodeCategories(matchedCategories[1]) : getKHentaiCategories(locale),
    minViews: minView?.toString(),
    maxViews: maxView?.toString(),
    minPages: minPage?.toString(),
    maxPages: maxPage?.toString(),
    startDate: from?.toString(),
    endDate: to?.toString(),
    minRating: minRating?.toString(),
    maxRating: maxRating?.toString(),
    uploader: query?.match(/\buploader:(\S+)/i)?.[1],
  }

  try {
    if (requestSignal?.aborted) {
      return new Response('Client Closed Request', { status: 499 })
    }

    const revalidate = params.nextId ? sec('30 days') : 0
    const options = { next: { revalidate }, signal: requestSignal }
    const searchedMangas = await kHentaiClient.searchMangas(params, locale ?? Locale.KO, options)
    const hasManga = searchedMangas.length > 0
    let nextCursor = null

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
      if (chance(0.2)) {
        waitUntil(postSearchKeyword(query, requestSignal))
      }
    }

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
    const promotion = !nextId ? getKeywordPromotion(query) : null

    const response: GETProxyKSearchResponse = {
      mangas,
      nextCursor,
      ...(promotion && { promotion }),
    }

    return Response.json(response, { headers: getCacheControlHeader(params) })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function getCacheControlHeader(params: KHentaiMangaSearchOptions) {
  const { nextId, nextViews, sort } = params

  if (sort === 'random') {
    return createCacheControlHeaders({
      vercel: {
        maxAge: sec('10 seconds'),
      },
      browser: {
        public: true,
        maxAge: 3,
        sMaxAge: sec('40 seconds'),
        swr: sec('10 seconds'),
      },
    })
  }

  if (nextId) {
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

  if (nextViews) {
    return createCacheControlHeaders({
      vercel: {
        maxAge: sec('1 hour'),
      },
      browser: {
        public: true,
        maxAge: 3,
        sMaxAge: sec('1 day'),
        swr: sec('10 minutes'),
      },
    })
  }

  return createCacheControlHeaders({
    vercel: {
      maxAge: sec('10 minutes'),
    },
    browser: {
      public: true,
      maxAge: 3,
      sMaxAge: sec('1 hour'),
      swr: sec('10 minutes'),
    },
  })
}

function getKHentaiCategories(locale?: Locale) {
  if (locale === Locale.JA) {
    return '1,2,3,6'
  }
  return undefined
}

function getKHentaiLanguageFilter(locale: Locale) {
  return {
    [Locale.KO]: 'language:korean',
    [Locale.EN]: 'language:english',
    [Locale.JA]: '-language:translated',
    [Locale.ZH_CN]: 'language:chinese',
    [Locale.ZH_TW]: 'language:chinese',
  }[locale]
}

async function postSearchKeyword(keyword: string, signal?: AbortSignal) {
  const body: POSTV1SearchTrendingBody = { keywords: [keyword] }

  try {
    return await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/trending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return
    }
    console.error('trackSearchKeyword error:', error instanceof Error ? error.message : String(error))
  }
}
