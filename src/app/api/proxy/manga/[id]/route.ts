import { fetchMangaFromMultiSources } from '@/common/manga'
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

    const successHeaders = {
      'Cache-Control': createCacheControl({
        public: true,
        maxAge: sec('10 hours'),
        sMaxAge: sec('10 hours'),
        swr: sec('1 hour'),
      }),
    }

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
