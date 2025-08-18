import { getMangaFromMultipleSources } from '@/common/manga'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'
import { sec } from '@/utils/date'

import { GETProxyMangaIdSchema } from './schema'

export const runtime = 'edge'

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
    const manga = await getMangaFromMultipleSources(id, 0)

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    const maxAge = sec('1 hour')
    const swr = sec('5 minutes')

    const cacheControl = createCacheControl({
      public: true,
      maxAge,
      sMaxAge: sec('1 day') - maxAge - swr,
      swr,
    })

    return Response.json(manga, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
