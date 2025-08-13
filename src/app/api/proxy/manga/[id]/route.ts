import { getMangaFromMultipleSources } from '@/common/manga'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { RouteProps } from '@/types/nextjs'

import { GETProxyMangaIdSchema } from './schema'

export const runtime = 'edge'
const revalidate = 43200 // 12 hours

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
    const manga = await getMangaFromMultipleSources(id, revalidate)

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    return Response.json(manga, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge: revalidate,
          sMaxAge: revalidate,
          staleWhileRevalidate: revalidate,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
