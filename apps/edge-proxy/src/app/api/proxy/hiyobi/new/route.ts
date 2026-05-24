import { hiyobiClient } from '@litomi/crawler/sources/hiyobi'
import { TOTAL_HIYOBI_PAGES } from '@litomi/crawler/sources/policy'
import { Locale } from '@litomi/domain/locale'
import { createCacheControlHeaders } from '@litomi/http/cache-control'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import { sec } from '@litomi/std'
import z from 'zod'

import { createProxyHeaders, withProxyHeaders } from '@/util/http'
import { handleRouteError } from '@/util/proxy-route'

export const runtime = 'edge'

const GETProxyHiyobiNewSchema = z.object({
  page: z.coerce.number().int().positive().max(TOTAL_HIYOBI_PAGES),
  locale: z.enum(Locale).default(Locale.KO),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  const validation = GETProxyHiyobiNewSchema.safeParse(searchParams)

  if (!validation.success) {
    const response = createProblemDetailsResponse(request, {
      status: 400,
      code: 'bad-request',
      detail: '잘못된 요청이에요',
      headers: createProxyHeaders(),
    })
    return response
  }

  const { page, locale } = validation.data

  if (request.signal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
      headers: createProxyHeaders(),
    })
    return response
  }

  try {
    const mangas = await hiyobiClient.fetchMangas({ page, locale, signal: request.signal })

    const headers = createProxyHeaders(
      createCacheControlHeaders({
        vercel: {
          maxAge: sec('4 hours'),
        },
        browser: {
          public: true,
          maxAge: sec('30 minutes'),
          sMaxAge: sec('4 hours'),
          swr: sec('30 minutes'),
        },
      }),
    )

    return Response.json(mangas, { headers })
  } catch (error) {
    return withProxyHeaders(handleRouteError(error, request))
  }
}
