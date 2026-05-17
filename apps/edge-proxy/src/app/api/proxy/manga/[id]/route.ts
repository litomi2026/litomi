import { Locale } from '@litomi/catalog/translation/common'
import { fetchMangaFromMultiSources } from '@litomi/crawler/common/manga'
import {
  calculateOptimalCacheDuration,
  createCacheControlHeaders,
  createProblemDetailsResponse,
  handleRouteError,
} from '@litomi/crawler/crawler/proxy-utils'
import { BLACKLISTED_MANGA_IDS, LAST_VERIFIED_MANGA_ID } from '@litomi/domain/constants/policy'
import { RouteProps } from '@litomi/domain/types/nextjs'
import { env } from '@litomi/env/env/client'
import { DEGRADED_HEADER, DEGRADED_REASON_HEADER } from '@litomi/http/degraded-response'
import { sec } from '@litomi/std'
import { checkBotId } from 'botid/server'

import { GETProxyMangaIdSchema } from './schema'

export const runtime = 'edge'

const { NEXT_PUBLIC_APP_ORIGIN } = env
const BOT_ID_ALLOWED_FRONTEND_HOSTS = ['litomi.in', 'stg.litomi.in']

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyMangaIdSchema.safeParse({
    id: (await params).id,
    locale: searchParams.get('locale') ?? Locale.KO,
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
    const forbiddenHeaders = createCacheControlHeaders({
      vercel: {
        maxAge: sec('90 days'),
      },
      browser: {
        public: true,
        maxAge: 3,
        sMaxAge: sec('30 days'),
        swr: sec('10 minutes'),
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
    // const botVerification = await checkBotId({
    //   advancedOptions: {
    //     checkLevel: 'basic',
    //     extraAllowedHosts: BOT_ID_ALLOWED_FRONTEND_HOSTS,
    //   },
    // })

    // if (botVerification.isBot) {
    //   const forbiddenHeaders = createCacheControlHeaders({
    //     vercel: {
    //       noStore: true,
    //     },
    //     browser: {
    //       noStore: true,
    //     },
    //   })

    //   return createProblemDetailsResponse(request, {
    //     status: 403,
    //     code: 'forbidden',
    //     detail: '요청하신 작품은 접근할 수 없어요',
    //     headers: createProxyHeaders(forbiddenHeaders),
    //   })
    // }

    const manga = await fetchMangaFromMultiSources({ id, locale })

    if (!manga) {
      const isPermanentlyMissing = id <= LAST_VERIFIED_MANGA_ID

      const notFoundHeaders = createCacheControlHeaders({
        vercel: {
          maxAge: isPermanentlyMissing ? sec('90 days') : sec('10 minutes'),
        },
        browser: {
          public: true,
          maxAge: 3,
          sMaxAge: isPermanentlyMissing ? sec('30 days') : sec('1 hour'),
          swr: sec('10 minutes'),
        },
      })

      return createProblemDetailsResponse(request, {
        status: isPermanentlyMissing ? 410 : 404,
        code: 'not-found',
        detail: '요청하신 작품을 찾을 수 없어요',
        headers: createProxyHeaders(notFoundHeaders),
      })
    }

    if ('isError' in manga) {
      const errorHeaders = createCacheControlHeaders({
        vercel: {
          maxAge: 3,
        },
        browser: {
          public: true,
          maxAge: 3,
          sMaxAge: 10,
        },
      })

      const headers = new Headers(errorHeaders)
      headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
      headers.set(DEGRADED_HEADER, '1')
      headers.set(DEGRADED_REASON_HEADER, 'IMAGES_ONLY')

      const { isError: _, ...mangaWithoutIsError } = manga
      return Response.json(mangaWithoutIsError, { headers })
    }

    // NOTE: 첫번쨰 이미지만 확인함
    const firstImageURL = manga.images?.[0]?.original?.url ?? manga.images?.[0]?.thumbnail?.url ?? ''
    const optimalCacheDuration = calculateOptimalCacheDuration([firstImageURL])
    const swr = Math.floor(optimalCacheDuration * 0.01)

    const successHeaders = createCacheControlHeaders({
      vercel: {
        maxAge: 3,
      },
      browser: {
        public: true,
        maxAge: 3,
        sMaxAge: optimalCacheDuration - swr,
        swr,
      },
    })

    const headers = new Headers(successHeaders)
    headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return Response.json(manga, { headers })
  } catch (error) {
    const response = handleRouteError(error, request)
    response.headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
    return response
  }
}

function createProxyHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  headers.set('Access-Control-Allow-Origin', NEXT_PUBLIC_APP_ORIGIN)
  return headers
}
