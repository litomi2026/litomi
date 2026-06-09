import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchProxyAPIData } from '@/utils/proxy-api-request'

const { NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN } = env

type QueryOptions = {
  page: number
}

export function useNewMangaQuery({ page }: QueryOptions) {
  const locale = useLocale()

  return useQuery({
    queryKey: QueryKeys.proxyHiyobiNew(page, locale),
    queryFn: () => fetchNewManga(page, locale),
  })
}

async function fetchNewManga(page: number, locale: string) {
  const url = new URL('/api/proxy/hiyobi/new', NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN)
  url.searchParams.set('page', String(page))
  url.searchParams.set('locale', locale)

  const { data } = await fetchProxyAPIData<Manga[]>(url)
  return data
}
