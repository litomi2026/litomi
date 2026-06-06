import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { createCanonicalSearchParams } from '@/app/[locale]/(navigation)/search/canonicalSearchParams'
import { SearchParam, SearchSort } from '@/app/[locale]/(navigation)/search/constants'
import {
  addLanguageFilterIfMissing,
  readPreferredSearchLanguage,
} from '@/app/[locale]/(navigation)/search/searchLanguage'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

type ProxyRandomResponse = {
  mangas: Manga[]
}

export function useRandomMangaQuery() {
  const { data: me, isPending: isMePending } = useMeQuery()
  const params = new URLSearchParams()
  params.set(SearchParam.SORT, SearchSort.RANDOM)

  if (!isMePending) {
    const condition = addLanguageFilterIfMissing(params.get(SearchParam.QUERY), readPreferredSearchLanguage(me))

    if (condition) {
      params.set(SearchParam.QUERY, condition)
    }
  }

  const randomManga = useQuery({
    queryKey: QueryKeys.proxyKRandom(params),
    queryFn: () => fetchRandomManga(params),
    enabled: !isMePending,
  })

  return { ...randomManga, isLoading: isMePending || randomManga.isLoading }
}

async function fetchRandomManga(params: URLSearchParams) {
  const url = new URL('/api/proxy/k/search', NEXT_PUBLIC_EDGE_PROXY_ORIGIN)
  url.search = createCanonicalSearchParams(params).toString()
  const { data } = await fetchAPIData<ProxyRandomResponse>(url)
  return data
}
