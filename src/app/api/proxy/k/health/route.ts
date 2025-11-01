import { kHentaiClient } from '@/crawler/k-hentai'
import { createCacheControl, createHealthCheckHandler } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'

export const runtime = 'edge'
const maxAge = 5

export async function GET() {
  return createHealthCheckHandler(
    'k',
    {
      search: async () => Array.isArray(await kHentaiClient.searchMangas({ search: 'qwerpoiuasdflkj' }, Locale.KO)),
      images: async () =>
        (((await kHentaiClient.fetchManga({ id: 3291051, locale: Locale.KO })) ?? {}).images?.length ?? 0) > 0, // 인기순 1위 망가
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
