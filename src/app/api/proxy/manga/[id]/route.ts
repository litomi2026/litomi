import { fetchMangaFromMultiSources } from '@/common/manga'
import { BLACKLISTED_MANGA_IDS, LAST_VERIFIED_MANGA_ID } from '@/constants/policy'
import {
  applyCORSHeaders,
  calculateOptimalCacheDuration,
  createCacheControlHeaders,
  createCORSPreflightResponse,
  createProblemDetailsResponse,
  handleRouteError,
  withCORS,
} from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { RouteProps } from '@/types/nextjs'
import { DEGRADED_HEADER, DEGRADED_REASON_HEADER } from '@/utils/degraded-response'
import { sec } from '@/utils/format/date'

import { GETProxyMangaIdSchema } from './schema'

export const runtime = 'edge'

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
    return withCORS(
      request,
      createProblemDetailsResponse(request, {
        status: 400,
        code: 'bad-request',
        detail: '잘못된 요청이에요',
      }),
    )
  }

  const { id, locale } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    const forbiddenHeaders = createCacheControlHeaders({
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

    return withCORS(
      request,
      createProblemDetailsResponse(request, {
        status: 403,
        code: 'forbidden',
        detail: '요청하신 작품은 접근할 수 없어요',
        headers: forbiddenHeaders,
      }),
    )
  }

  try {
    if (request.signal?.aborted) {
      return withCORS(
        request,
        createProblemDetailsResponse(request, {
          status: 499,
          code: 'client-closed-request',
          detail: '요청이 취소됐어요',
        }),
      )
    }

    const manga = await fetchMangaFromMultiSources({ id, locale })

    if (!manga) {
      const isPermanentlyMissing = id <= LAST_VERIFIED_MANGA_ID

      const notFoundHeaders = createCacheControlHeaders({
        vercel: {
          maxAge: isPermanentlyMissing ? sec('30 days') : sec('10 minutes'),
        },
        browser: {
          public: true,
          maxAge: 3,
          sMaxAge: isPermanentlyMissing ? sec('30 days') : sec('1 hour'),
          swr: sec('10 minutes'),
        },
      })

      return withCORS(
        request,
        createProblemDetailsResponse(request, {
          status: isPermanentlyMissing ? 410 : 404,
          code: 'not-found',
          detail: '요청하신 작품을 찾을 수 없어요',
          headers: notFoundHeaders,
        }),
      )
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
      applyCORSHeaders(request, headers)
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
    applyCORSHeaders(request, headers)
    return Response.json(manga, { headers })
  } catch (error) {
    return withCORS(request, handleRouteError(error, request))
  }
}

export async function OPTIONS(request: Request) {
  return createCORSPreflightResponse(request)
}
