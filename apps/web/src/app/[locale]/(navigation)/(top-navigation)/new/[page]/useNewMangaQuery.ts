import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

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
  url.searchParams.set('page', String(page))
  const { data } = await fetchAPIData<Manga[]>(url, { credentials: 'omit' })
  return data
}
