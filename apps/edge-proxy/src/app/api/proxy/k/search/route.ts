import { encodeCategories, kHentaiClient, KHentaiMangaSearchOptions } from '@litomi/crawler/sources/k-hentai'
import { MAX_KHENTAI_SEARCH_QUERY_LENGTH } from '@litomi/crawler/sources/policy'
import { Locale } from '@litomi/domain/locale'
import { BLACKLISTED_MANGA_IDS } from '@litomi/domain/manga/policy'
import { createCacheControlHeaders } from '@litomi/http/cache-control'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import { sec } from '@litomi/std'

import { createProxyHeaders, withProxyHeaders } from '@/util/http'
import { handleRouteError } from '@/util/proxy-route'

import type { GETProxyKSearchResponse } from './types'

import { GETProxyKSearchSchema } from './schema'
import { convertToKHentaiKey, filterMangasByMinusPrefix } from './utils'

export const runtime = 'edge'

const JAPANESE_LANGUAGE_DEFAULT_CATEGORIES = encodeCategories('doujinshi,manga,artist_cg,image_set')

export async function GET(request: Request) {
  const requestSignal = request.signal
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyKSearchSchema.safeParse(searchParams)

  if (!validation.success) {
    const response = createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
      headers: createProxyHeaders(),
    })
    return response
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

  const { defaultCategories, rewrittenQuery } = rewriteJapaneseLanguageQuery(query)
  const lowerQuery = convertToKHentaiKey(rewrittenQuery?.toLowerCase())
  const search = lowerQuery?.replace(/\b(type|uploader):\S+/gi, '').trim() ?? ''
  const matchedCategories = rewrittenQuery?.match(/(?:^|\s)type:(\S+)/i)

  if (search && search.length > MAX_KHENTAI_SEARCH_QUERY_LENGTH) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'query-too-long',
      detail: '검색어가 너무 길어요',
      headers: createProxyHeaders(),
    })
  }

  const params: KHentaiMangaSearchOptions = {
    search,
    nextId: nextId?.toString(),
    nextViews: nextViews?.toString(),
    nextViewsId: nextViewsId?.toString(),
    sort,
    offset: skip?.toString(),
    categories: matchedCategories ? encodeCategories(matchedCategories[1]) : defaultCategories,
    minViews: minView?.toString(),
    maxViews: maxView?.toString(),
    minPages: minPage?.toString(),
    maxPages: maxPage?.toString(),
    startDate: from?.toString(),
    endDate: to?.toString(),
    minRating: minRating?.toString(),
    maxRating: maxRating?.toString(),
    uploader: rewrittenQuery?.match(/\buploader:(\S+)/i)?.[1],
  }

  if (requestSignal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
      headers: createProxyHeaders(),
    })
    return response
  }

  try {
    const revalidate = params.nextId ? sec('30 days') : 0
    const options = { next: { revalidate }, signal: requestSignal }
    const searchedMangas = await kHentaiClient.searchMangas(params, Locale.KO, options)
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
    const mangas = filterMangasByMinusPrefix(filteredMangas, rewrittenQuery)
    const response: GETProxyKSearchResponse = {
      mangas,
      nextCursor,
    }

    const headers = createProxyHeaders(getCacheControlHeader(params))
    return Response.json(response, { headers })
  } catch (error) {
    return withProxyHeaders(handleRouteError(error, request))
  }
}

function getCacheControlHeader(params: KHentaiMangaSearchOptions) {
  const { nextId, nextViews, sort } = params

  if (sort === 'random') {
    return createCacheControlHeaders({
      vercel: {
        maxAge: 20,
        swr: 5,
      },
      cloudflare: {
        public: true,
        maxAge: 10,
        swr: 5,
      },
      browser: {
        public: true,
        maxAge: 5,
        swr: 5,
      },
    })
  }

  const swr = sec('10 minutes')

  if (nextId) {
    return createCacheControlHeaders({
      vercel: {
        maxAge: sec('90 days'),
        swr,
      },
      browser: {
        public: true,
        maxAge: 3,
      },
    })
  }

  if (nextViews) {
    return createCacheControlHeaders({
      vercel: {
        maxAge: sec('1 hour'),
        swr,
      },
      browser: {
        public: true,
        maxAge: 3,
      },
    })
  }

  return createCacheControlHeaders({
    vercel: {
      maxAge: sec('1 hour'),
      swr,
    },
    browser: {
      public: true,
      maxAge: 3,
    },
  })
}

function rewriteJapaneseLanguageQuery(query: string | undefined) {
  if (!query) {
    return {
      rewrittenQuery: query,
      defaultCategories: undefined,
    }
  }

  const tokens = query.trim().split(/\s+/)
  const hasJapaneseLanguage = tokens.some((token) => token.toLowerCase() === 'language:japanese')

  if (!hasJapaneseLanguage) {
    return {
      rewrittenQuery: query,
      defaultCategories: undefined,
    }
  }

  const rewrittenTokens = tokens.filter((token) => token.toLowerCase() !== 'language:japanese')

  if (!rewrittenTokens.some((token) => token.toLowerCase() === '-language:translated')) {
    rewrittenTokens.push('-language:translated')
  }

  const hasType = rewrittenTokens.some((token) => /^type:/i.test(token))

  return {
    rewrittenQuery: rewrittenTokens.join(' '),
    defaultCategories: hasType ? undefined : JAPANESE_LANGUAGE_DEFAULT_CATEGORIES,
  }
}
