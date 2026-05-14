import type { Manga } from '@litomi/domain/types/manga'

import { Locale } from '@litomi/catalog/translation/common'
import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN } = env

type QueryOptions = {
  page: number
}

export function useNewMangaQuery({ page }: QueryOptions) {
  return useQuery({
    queryKey: QueryKeys.proxyHiyobiNew(page),
    queryFn: () => fetchNewManga(page),
  })
}

async function fetchNewManga(page: number) {
  const url = new URL('/api/proxy/hiyobi/new', NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN)
  url.searchParams.set('locale', Locale.KO)
  url.searchParams.set('page', String(page))
  const { data } = await fetchWithErrorHandling<Manga[]>(url)
  return data
}
