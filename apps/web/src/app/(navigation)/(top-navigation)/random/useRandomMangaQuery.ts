import type { Manga } from '@litomi/domain/manga/model'

import { Locale } from '@litomi/domain/locale'
import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

type ProxyRandomResponse = {
  mangas: Manga[]
}

export function useRandomMangaQuery() {
  return useQuery({
    queryKey: QueryKeys.proxyKRandom,
    queryFn: () => fetchRandomManga(),
  })
}

async function fetchRandomManga() {
  const url = new URL('/api/proxy/k/search', NEXT_PUBLIC_EDGE_PROXY_ORIGIN)
  url.searchParams.set('locale', Locale.KO)
  url.searchParams.set('sort', 'random')

  const { data } = await fetchAPIData<ProxyRandomResponse>(url)
  return data
}
