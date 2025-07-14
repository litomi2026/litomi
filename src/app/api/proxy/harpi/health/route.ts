import { HarpiClient } from '@/crawler/harpi'
import { createCacheControl, createHealthCheckHandler } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 5

export async function GET() {
  return createHealthCheckHandler(
    'harpi',
    {
      search: async () => Array.isArray(await HarpiClient.getInstance().fetchMangas()),
      manga: async () => Boolean(await HarpiClient.getInstance().fetchMangaByHarpiId('67e5a1b843721660bba361b2')), // 조회수 1위 망가
    },
    {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          staleWhileRevalidate: maxAge,
        }),
      },
    },
  )
}
