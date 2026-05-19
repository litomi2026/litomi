import { Locale } from '@litomi/catalog/translation/common'
import { hiyobiClient } from '@litomi/crawler/crawler/hiyobi'
import {
  createCacheControlHeaders,
  createProblemDetailsResponse,
  handleRouteError,
} from '@litomi/crawler/crawler/proxy-utils'
import { TOTAL_HIYOBI_PAGES } from '@litomi/domain/constants/policy'
import { sec } from '@litomi/std'
import z from 'zod'

import { createProxyHeaders, withProxyHeaders } from '@/util/http'

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
    const mangas = await hiyobiClient.fetchMangas({ page, locale })

    const headers = createProxyHeaders(
      createCacheControlHeaders({
        vercel: {
          maxAge: sec('6 hours'),
        },
        browser: {
          public: true,
          maxAge: sec('30 minutes'),
          sMaxAge: sec('6 hours'),
          swr: sec('30 minutes'),
        },
      }),
    )

    return Response.json(mangas, { headers })
  } catch (error) {
    return withProxyHeaders(handleRouteError(error, request))
  }
}
