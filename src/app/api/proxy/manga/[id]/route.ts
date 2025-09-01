import { getMangaFromMultiSources } from '@/common/manga'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { Manga } from '@/types/manga'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { GETProxyMangaIdSchema } from './schema'

export const runtime = 'edge'

export type GETProxyMangaIdResponse = Manga | null

type Params = {
  id: string
}

export async function GET(request: Request, { params }: RouteProps<Params>) {
  const validation = GETProxyMangaIdSchema.safeParse(await params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { id } = validation.data

  try {
    const manga = await getMangaFromMultiSources(id, 0)

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    if ('isError' in manga && manga.isError) {
      const cacheControl = createCacheControl({ public: true, maxAge: sec('10 minutes') })
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

    return Response.json(manga, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
