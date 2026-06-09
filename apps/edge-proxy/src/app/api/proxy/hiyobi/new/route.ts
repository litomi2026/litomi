import { hiyobiClient } from '@litomi/crawler/sources/hiyobi'
import { TOTAL_HIYOBI_PAGES } from '@litomi/crawler/sources/policy'
import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { createCacheControlHeaders } from '@litomi/http/cache-control'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import { sec } from '@litomi/std'
import z from 'zod'

import { createProxyHeaders, withProxyHeaders } from '@/util/http'
import { proxyLocaleSchema } from '@/util/locale'
import { handleRouteError } from '@/util/proxy-route'

export const runtime = 'edge'

const GETProxyHiyobiNewSchema = z.object({
  locale: proxyLocaleSchema,
  page: z.coerce.number().int().positive().max(TOTAL_HIYOBI_PAGES),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyHiyobiNewSchema.safeParse(searchParams)

  if (!validation.success) {
    return createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
      headers: createProxyHeaders(),
    })
  }

  const { locale, page } = validation.data

  if (request.signal?.aborted) {
    return createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
      headers: createProxyHeaders(),
    })
  }

  try {
    const mangas = await hiyobiClient.fetchMangas({ page, locale, signal: request.signal })

    const cacheControlHeader = createCacheControlHeaders({
      vercel: {
        public: true,
        maxAge: sec('4 hours'),
      },
      cloudflare: {
        public: true,
        maxAge: sec('10 minutes'),
      },
      browser: {
        public: true,
        maxAge: 3,
        swr: sec('10 minutes'),
      },
    })

    const headers = createProxyHeaders(cacheControlHeader)
    headers.set('Content-Language', LOCALE_LANGUAGE_TAGS[locale])

    return Response.json(mangas, { headers })
  } catch (error) {
    return withProxyHeaders(handleRouteError(error, request))
  }
}
