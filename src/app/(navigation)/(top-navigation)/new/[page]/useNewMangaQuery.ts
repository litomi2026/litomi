import { useQuery } from '@tanstack/react-query'

import type { Manga } from '@/types/manga'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

type QueryOptions = {
  page: number
}

export function useNewMangaQuery({ page }: QueryOptions) {
  return useQuery({
    queryKey: QueryKeys.proxyHiyobiNew(page),
    queryFn: async () => {
      const url = new URL('/api/proxy/hiyobi/new', NEXT_PUBLIC_EXTERNAL_API_PROXY_URL)
      url.searchParams.set('page', String(page))
      url.searchParams.set('locale', 'ko')
      const { data } = await fetchWithErrorHandling<Manga[]>(url)
      return data
    },
  })
}
