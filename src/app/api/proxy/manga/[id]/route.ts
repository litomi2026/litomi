import { unstable_cache } from 'next/cache'

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
    const manga = await getCachedManga(id)

    if (!manga) {
      return new Response('Not Found', { status: 404 })
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: revalidate,
      sMaxAge: revalidate,
      staleWhileRevalidate: revalidate,
    })

    return Response.json(manga, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

// TODO: 추후 'use cache' 로 변경하면서 getCachedManga 함수 제거하기
const getCachedManga = unstable_cache(
  async (id: number) => getMangaFromMultipleSources(id, revalidate),
  ['getCachedManga'],
  { revalidate },
)
