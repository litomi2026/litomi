import type { Manga } from '@litomi/domain/types/manga'

import { Locale } from '@litomi/catalog/translation/common'
import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

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

  const { data } = await fetchWithErrorHandling<ProxyRandomResponse>(url)
  return data
}
