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
      cloudflare: {
        maxAge: sec('30 days'),
        swr: sec('10 minutes'),
      },
      browser: {
        public: true,
        maxAge: 3,
      },
    })

    return new Response('Forbidden', { status: 403, headers: forbiddenHeaders })
  }

  try {
    const manga = await fetchMangaFromMultiSources(id)

    if (!manga) {
      const notFoundHeaders = createCacheControlHeaders({
        cloudflare: {
          maxAge: sec('1 hour'),
          swr: sec('10 minutes'),
        },
        browser: {
          public: true,
          maxAge: 3,
        },
      })

      return new Response('Not Found', { status: 404, headers: notFoundHeaders })
    }

    const optimalCacheDuration = calculateOptimalCacheDuration(manga.images)
    const swr = Math.floor(optimalCacheDuration * 0.01)

    const successHeaders = createCacheControlHeaders({
      cloudflare: {
        maxAge: optimalCacheDuration - swr,
        swr,
      },
      browser: {
        public: true,
        maxAge: 3,
      },
    })

    const responseData = getMangaResponseData(manga, scope)
    return Response.json(responseData, { headers: successHeaders })
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
      return {
        origin: manga.origin,
        images: manga.images,
      }

    default:
      return manga
  }
}
