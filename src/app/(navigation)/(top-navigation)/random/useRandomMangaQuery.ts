import { useQuery } from '@tanstack/react-query'

import type { Manga } from '@/types/manga'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

type ProxyRandomResponse = {
  mangas: Manga[]
}

export function useRandomMangaQuery() {
  return useQuery({
    queryKey: QueryKeys.proxyKRandom,
    queryFn: async () => {
      const url = new URL('/api/proxy/k/search', NEXT_PUBLIC_EXTERNAL_API_PROXY_URL)
      url.searchParams.set('sort', 'random')
      url.searchParams.set('locale', 'ko')
      const { data } = await fetchWithErrorHandling<ProxyRandomResponse>(url)
      return data
    },
  })
}
