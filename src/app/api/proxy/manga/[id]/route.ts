import { getMangaFromMultiSources } from '@/common/manga'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { GETProxyMangaIdSchema, MangaResponseScope } from './schema'

export const runtime = 'edge'

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyMangaIdSchema.safeParse({
    id: (await params).id,
    only: searchParams.get('only'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id, only } = validation.data

  try {
    const manga = await getMangaFromMultiSources(id, 0)

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    if ('isError' in manga && manga.isError) {
      const cacheControl = createCacheControl({
        public: true,
        maxAge: sec('1 minute'),
        sMaxAge: sec('1 minute'),
      })

      return Response.json(manga, { headers: { 'Cache-Control': cacheControl } })
    }

    const maxAge = sec('1 hour')
    const swr = sec('5 minutes')

    const cacheControl = createCacheControl({
      public: true,
      maxAge,
      sMaxAge: sec('1 day') - maxAge - Math.min(swr, maxAge),
      swr,
    })

    if (only === MangaResponseScope.IMAGE) {
      return Response.json(
        { origin: manga.origin, images: manga.images },
        { headers: { 'Cache-Control': cacheControl } },
      )
    }

    return Response.json(manga, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
