import { fetchMangaFromMultiSources } from '@litomi/crawler/manga/multi-source'
import { LOCALE_LANGUAGE_TAGS, PUBLIC_LOCALES } from '@litomi/domain/locale'
import { BLACKLISTED_MANGA_IDS, LAST_VERIFIED_MANGA_ID, MAX_MANGA_ID } from '@litomi/domain/manga/policy'
import { createCacheControlHeaders } from '@litomi/http/cache-control'
import { DEGRADED_HEADER, DEGRADED_REASON_HEADER } from '@litomi/http/degraded-response'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import { sec } from '@litomi/std'
import type { Context } from 'hono'
import { z } from 'zod'

import { createProxyHeaders, withProxyHeaders } from '@/util/http'
import { calculateOptimalCacheDuration, handleRouteError } from '@/util/proxy-route'

const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
  locale: z.enum(PUBLIC_LOCALES),
})

const BROWSER_CACHE_MAX_AGE = 3

export async function handleMangaProxy(c: Context): Promise<Response> {
  const request = c.req.raw
  const url = new URL(request.url)

  const validation = GETProxyMangaIdSchema.safeParse({
    id: c.req.param('id'),
    ...Object.fromEntries(url.searchParams),
  })

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
      headers: createProxyHeaders(),
    })
  }

  const { id, locale } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    const swr = sec('10 minutes')

    const forbiddenHeaders = createCacheControlHeaders({
      cloudflare: {
        public: true,
        maxAge: sec('90 days'),
        swr,
      },
      browser: {
        public: true,
        maxAge: sec('10 minutes'),
        swr,
      },
    })

    return createProblemDetailsResponse(request, {
      status: 403,
      code: 'forbidden',
      detail: '요청하신 작품은 접근할 수 없어요',
      headers: createProxyHeaders(forbiddenHeaders),
    })
  }

  if (request.signal?.aborted) {
    return createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
      headers: createProxyHeaders(),
    })
  }

  try {
    const manga = await fetchMangaFromMultiSources({ id, locale, signal: request.signal })

    if (!manga) {
      if (id <= LAST_VERIFIED_MANGA_ID) {
        const swr = sec('10 minutes')

        const headers = createCacheControlHeaders({
          cloudflare: {
            public: true,
            maxAge: sec('90 days'),
            swr,
          },
          browser: {
            public: true,
            maxAge: 3,
            swr,
          },
        })

        return createProblemDetailsResponse(request, {
          status: 410,
          code: 'not-found',
          detail: '요청하신 작품을 찾을 수 없어요',
          headers: createProxyHeaders(headers),
        })
      }

      const headers = createCacheControlHeaders({
        cloudflare: {
          public: true,
          maxAge: sec('1 hour'),
        },
        browser: {
          public: true,
          maxAge: 3,
        },
      })

      return createProblemDetailsResponse(request, {
        status: 404,
        code: 'not-found',
        detail: '요청하신 작품을 찾을 수 없어요',
        headers: createProxyHeaders(headers),
      })
    }

    if ('isError' in manga) {
      const errorHeaders = createCacheControlHeaders({
        cloudflare: {
          public: true,
          maxAge: 10,
        },
        browser: {
          public: true,
          maxAge: 3,
        },
      })

      const headers = createProxyHeaders(errorHeaders)
      headers.set('Content-Language', LOCALE_LANGUAGE_TAGS[locale])
      headers.set(DEGRADED_HEADER, '1')
      headers.set(DEGRADED_REASON_HEADER, 'IMAGES_ONLY')

      const { isError: _, ...mangaWithoutIsError } = manga
      return Response.json(mangaWithoutIsError, { headers })
    }

    // NOTE: 모든 이미지 TTL이 동일해서 첫 번째 이미지만 확인함
    const firstImageURL = manga.images?.[0]?.original?.url ?? manga.images?.[0]?.thumbnail?.url ?? ''
    const optimalCacheDuration = calculateOptimalCacheDuration([firstImageURL])
    const cacheBudget = Math.max(0, optimalCacheDuration - BROWSER_CACHE_MAX_AGE)
    const swr = Math.min(sec('10 minutes'), Math.floor(cacheBudget * 0.005))

    const successHeaders = createCacheControlHeaders({
      cloudflare: {
        public: true,
        maxAge: cacheBudget - swr,
        swr,
      },
      browser: {
        public: true,
        maxAge: BROWSER_CACHE_MAX_AGE,
      },
    })

    const headers = createProxyHeaders(successHeaders)
    headers.set('Content-Language', LOCALE_LANGUAGE_TAGS[locale])

    return Response.json(manga, { headers })
  } catch (error) {
    return withProxyHeaders(handleRouteError(error, request))
  }
}
