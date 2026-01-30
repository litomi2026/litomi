import { useQuery } from '@tanstack/react-query'

import type { Manga } from '@/types/manga'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { Locale } from '@/translation/common'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

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
  const url = new URL('/api/proxy/hiyobi/new', NEXT_PUBLIC_EXTERNAL_API_PROXY_URL)
  url.searchParams.set('locale', Locale.KO)
  url.searchParams.set('page', String(page))
  const { data } = await fetchWithErrorHandling<Manga[]>(url)
  return data
}
