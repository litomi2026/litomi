import { fetchMangaFromMultiSources } from '@/common/manga'
import { BLACKLISTED_MANGA_IDS } from '@/constants/policy'
import { createCacheControlHeaders, handleRouteError } from '@/crawler/proxy-utils'
import { Manga, MangaError } from '@/types/manga'
import { RouteProps } from '@/types/nextjs'
import { calculateOptimalCacheDuration } from '@/utils/cache-control'
import { sec } from '@/utils/date'

import { GETProxyMangaIdSchema, MangaResponseScope } from './schema'

export const runtime = 'edge'

type Params = {
  id: string
}

const METADATA_FIELDS = [
  'artists',
  'characters',
  'count',
  'date',
  'description',
  'group',
  'languages',
  'lines',
  'series',
  'tags',
  'title',
  'type',
] as const

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyMangaIdSchema.safeParse({
    id: (await params).id,
    scope: searchParams.get('scope'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id, scope } = validation.data

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

    return new Response('Forbidden', { status: 403, headers: forbiddenHeaders })
  }

  try {
    const manga = await fetchMangaFromMultiSources(id)

    if (!manga) {
      const notFoundHeaders = createCacheControlHeaders({
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

      return new Response('Not Found', { status: 404, headers: notFoundHeaders })
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

    const result = getMangaResponseData(manga, scope)
    return Response.json(result, { headers: successHeaders })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function getMangaResponseData(manga: Manga | MangaError, scope: string | null) {
  switch (scope) {
    case MangaResponseScope.EXCLUDE_METADATA: {
      for (const field of METADATA_FIELDS) {
        delete manga[field]
      }
      return manga
    }

    case MangaResponseScope.IMAGE:
      return { images: manga.images }

    default:
      return manga
  }
}
