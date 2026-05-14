import { Locale } from '@litomi/catalog/translation/common'
import { hiyobiClient } from '@litomi/crawler/crawler/hiyobi'
import { createCacheControlHeaders, createProblemDetailsResponse, handleRouteError } from '@litomi/crawler/crawler/proxy-utils'
import { TOTAL_HIYOBI_PAGES } from '@litomi/domain/constants/policy'
import { env } from '@litomi/env/env/client'
import { sec } from '@litomi/std/format/date'
import z from 'zod'

export const runtime = 'edge'

const { NEXT_PUBLIC_APP_ORIGIN } = env

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
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }

  const { page, locale } = validation.data

  if (request.signal?.aborted) {
    const response = createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
    })
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }

  try {
    const mangas = await hiyobiClient.fetchMangas({ page, locale })

    const headers = new Headers(
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

    headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)

    return Response.json(mangas, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }
}
