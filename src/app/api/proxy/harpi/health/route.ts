import { harpiClient } from '@/crawler/harpi/harpi'
import { createCacheControl, createHealthCheckHandler } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'

// NOTE: cycletls 사용을 위해 Node.js 런타임 필요 (Edge Runtime 제거)
export const runtime = 'nodejs'
const maxAge = 5

export async function GET() {
  return createHealthCheckHandler(
    'harpi',
    {
      search: async () => Boolean(await harpiClient.searchMangas({}, Locale.KO)),
      manga: async () => Boolean(await harpiClient.fetchManga({ id: 3675388, locale: Locale.KO })), // 최신 망가 ID
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
