import z from 'zod'

import { TOTAL_HIYOBI_PAGES } from '@/constants/policy'
import { hiyobiClient } from '@/crawler/hiyobi'
import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@/crawler/proxy-utils'
import { env } from '@/env/client'
import { Locale } from '@/translation/common'
import { sec } from '@/utils/format/date'

export const runtime = 'edge'

const { NEXT_PUBLIC_CANONICAL_URL } = env

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
    })
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }

  const { page, locale } = validation.data

  if (request.signal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
    })
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }

  try {
    const mangas = await hiyobiClient.fetchMangas({ page, locale })

    const headers = new Headers(
      createCacheControlHeaders({
        vercel: {
          maxAge: sec('30 minutes'),
        },
        browser: {
          public: true,
          maxAge: 3,
          sMaxAge: sec('3 hours'),
          swr: sec('30 minutes'),
        },
      }),
    )

    headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)

    return Response.json(mangas, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_CANONICAL_URL)
    return response
  }
}
