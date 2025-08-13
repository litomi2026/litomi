import { getMangasFromMultipleSources } from '@/common/manga'
import { MAX_THUMBNAIL_IMAGES } from '@/constants/manga'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

import { GETProxyIdSchema, ProxyIdOnly } from './schema'

export const runtime = 'edge'
const revalidate = 43200 // 12 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const validation = GETProxyIdSchema.safeParse({
    ids: searchParams.getAll('id'),
    only: searchParams.get('only'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { ids, only } = validation.data
  const uniqueIds = Array.from(new Set(ids))

  try {
    const mangas = await getMangasFromMultipleSources(uniqueIds)

    if (Object.keys(mangas).length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    if (only === ProxyIdOnly.THUMBNAIL) {
      for (const id of uniqueIds) {
        mangas[id].images = mangas[id].images.slice(0, MAX_THUMBNAIL_IMAGES)
      }
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: revalidate,
      sMaxAge: revalidate,
      staleWhileRevalidate: revalidate,
    })

    return Response.json(mangas, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
