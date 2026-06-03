import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { fetchAPIData } from '@/utils/api-request'

import { SearchParam, SearchSort } from './constants'
import { addLanguageFilterIfMissing, readPreferredSearchLanguage } from './searchLanguage'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
}

export function useSearchQuery(searchParams: URLSearchParams) {
  const { data: me, isPending: isMePending } = useMeQuery()
  const allowedParams = new URLSearchParams(whitelistParams(searchParams, Object.values(SearchParam)))

  if (!isMePending) {
    const condition = addLanguageFilterIfMissing(allowedParams.get(SearchParam.QUERY), readPreferredSearchLanguage(me))

    if (condition) {
      allowedParams.set(SearchParam.QUERY, condition)
    } else {
      allowedParams.delete(SearchParam.QUERY)
    }
  }

  const mangaSearch = useInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(allowedParams),
    queryFn: async ({ pageParam: cursor }) => {
      const pagedParams = new URLSearchParams(allowedParams)

      if (cursor) {
        const cursorValue = cursor.toString()
        if (pagedParams.get(SearchParam.SORT) === SearchSort.POPULAR) {
          const [nextViews, nextViewsId] = cursorValue.split('-')
          pagedParams.set(SearchParam.NEXT_VIEWS, nextViews)
          pagedParams.set(SearchParam.NEXT_VIEWS_ID, nextViewsId)
        } else {
          pagedParams.set(SearchParam.NEXT_ID, cursorValue)
        }
        pagedParams.delete(SearchParam.SKIP)
      }

      const url = new URL('/api/proxy/k/search', NEXT_PUBLIC_EDGE_PROXY_ORIGIN)
      url.search = pagedParams.toString()
      const { data } = await fetchAPIData<GETProxyKSearchResponse>(url)
      return data
    },
    enabled: !isMePending,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })

  return { ...mangaSearch, isLoading: isMePending || mangaSearch.isLoading }
}

function whitelistParams(params: URLSearchParams, whitelist: readonly string[]) {
  const allowed = new Set(whitelist)
  const filtered = Array.from(params).filter(([key]) => allowed.has(key))
  return new URLSearchParams(filtered)
}
