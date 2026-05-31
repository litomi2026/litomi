import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { whitelistSearchParams } from '@litomi/std'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { SearchParam, SearchSort } from './constants'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, Object.values(SearchParam))

  return useInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(whitelisted),
    queryFn: async ({ pageParam }) => {
      const searchParamsWithCursor = new URLSearchParams(whitelisted)

      if (pageParam) {
        const cursor = pageParam.toString()
        if (searchParamsWithCursor.get(SearchParam.SORT) === SearchSort.POPULAR) {
          const [nextViews, nextViewsId] = cursor.split('-')
          searchParamsWithCursor.set(SearchParam.NEXT_VIEWS, nextViews)
          searchParamsWithCursor.set(SearchParam.NEXT_VIEWS_ID, nextViewsId)
        } else {
          searchParamsWithCursor.set(SearchParam.NEXT_ID, cursor)
        }
        searchParamsWithCursor.delete(SearchParam.SKIP)
      }

      const url = new URL('/api/proxy/k/search', NEXT_PUBLIC_EDGE_PROXY_ORIGIN)
      url.search = searchParamsWithCursor.toString()
      const { data } = await fetchAPIData<GETProxyKSearchResponse>(url)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
