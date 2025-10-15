import { fetchMangaFromMultiSources } from '@/common/manga'
import { CANONICAL_URL } from '@/constants'
import { BLACKLISTED_MANGA_IDS } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga, MangaError } from '@/types/manga'
import { RouteProps } from '@/types/nextjs'
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
    const forbiddenHeaders = {
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('30 days'),
        sMaxAge: sec('30 days'),
        swr: sec('30 days'),
      }),
    }

    return new Response('Forbidden', { status: 403, headers: forbiddenHeaders })
  }

  try {
    const manga = await fetchMangaFromMultiSources(id)

    if (!manga) {
      const notFoundHeaders = {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: sec('1 hour'),
          sMaxAge: sec('1 hour'),
        }),
      }

      return new Response('Not Found', { status: 404, headers: notFoundHeaders })
    }

    const optimalCacheDuration = calculateOptimalCacheDuration(manga.images)
    const swrDuration = sec('10 minutes')
    const cloudflareDuration = Math.floor(optimalCacheDuration * 0.8)
    const vercelDuration = Math.floor(optimalCacheDuration * 0.1)
    const browserDuration = optimalCacheDuration - cloudflareDuration - vercelDuration

    const successHeaders = {
      'Vercel-CDN-Cache-Control': createCacheControl({
        maxAge: vercelDuration - swrDuration,
        swr: swrDuration,
      }),
      'Cloudflare-Cache-Control': createCacheControl({
        maxAge: cloudflareDuration - swrDuration,
        swr: swrDuration,
      }),
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: browserDuration - swrDuration,
        swr: swrDuration,
      }),
    }

    const responseData = getMangaResponseData(manga, scope)
    return Response.json(responseData, { headers: successHeaders })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function calculateOptimalCacheDuration(images: string[]): number {
  const now = Math.floor(Date.now() / 1000)
  let nearestExpiration

  for (const imageUrl of images) {
    const expiration = extractExpirationFromURL(imageUrl)
    if (expiration && expiration > now) {
      if (!nearestExpiration || expiration < nearestExpiration) {
        nearestExpiration = expiration
      }
    }
  }

  if (!nearestExpiration) {
    return sec('30 days')
  }

  // Apply a small buffer (5 minutes) for:
  // - Clock skew between servers
  // - Request processing time
  // - User's actual image loading time
  const buffer = sec('5 minutes')

  return nearestExpiration - buffer - now
}

function extractExpirationFromURL(imageUrl: string): number | null {
  try {
    const url = new URL(imageUrl, CANONICAL_URL)
    const expires = url.searchParams.get('expires')
    if (expires && /^\d+$/.test(expires)) {
      return parseInt(expires, 10)
    }
  } catch {
    // Not a valid URL
  }
  return null
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
