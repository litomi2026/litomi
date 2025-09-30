import { kHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, createHealthCheckHandler } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 5

export async function GET() {
  return createHealthCheckHandler(
    'k',
    {
      search: async () => Array.isArray(await kHentaiClient.searchMangas({ search: 'qwerpoiuasdflkj' }, 0)),
      images: async () => (((await kHentaiClient.fetchManga(3291051)) ?? {}).images?.length ?? 0) > 0, // 인기순 1위 망가
    },
    {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
        }),
      },
    },
  )
}
