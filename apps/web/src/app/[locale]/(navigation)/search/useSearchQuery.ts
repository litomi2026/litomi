import type { Manga } from '@litomi/domain/manga/model'

import { env } from '@litomi/env/client'
import { whitelistSearchParams } from '@litomi/std'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { SEARCH_PAGE_SEARCH_PARAMS } from './constants'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

type GETProxyKSearchResponse = {
  mangas: Manga[]
  nextCursor: string | null
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PAGE_SEARCH_PARAMS)

  return useInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(whitelisted),
    queryFn: async ({ pageParam }) => {
      const searchParamsWithCursor = new URLSearchParams(whitelisted)

      if (pageParam) {
        const cursor = pageParam.toString()
        if (searchParamsWithCursor.get('sort') === 'popular') {
          const [nextViews, nextViewsId] = cursor.split('-')
          searchParamsWithCursor.set('next-views', nextViews)
          searchParamsWithCursor.set('next-views-id', nextViewsId)
        } else {
          searchParamsWithCursor.set('next-id', cursor)
        }
        searchParamsWithCursor.delete('skip')
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
