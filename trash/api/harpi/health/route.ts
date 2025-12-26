import { harpiClient } from '@/crawler/harpi/harpi'
import { createCacheControl, createHealthCheckHandler } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'

export const runtime = 'edge'
const maxAge = 5

export async function GET() {
  return createHealthCheckHandler(
    'harpi',
    {
      search: async () => Boolean(await harpiClient.searchMangas({}, Locale.KO)),
      manga: async () =>
        Boolean(await harpiClient.fetchMangaByHarpiId({ id: '67e5a1b843721660bba361b2', locale: Locale.KO })), // 조회수 1위 망가
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
