import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETProxyKSearchResponse } from '@/app/api/proxy/k/search/route'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { whitelistSearchParams } from '@/utils/param'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import { SEARCH_PAGE_SEARCH_PARAMS } from './constants'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PAGE_SEARCH_PARAMS)
  const locale = getLocaleFromCookie()

  return useInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(whitelisted, locale),
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

      if (locale) {
        searchParamsWithCursor.set('locale', locale)
      }

      const url = `${NEXT_PUBLIC_EXTERNAL_API_PROXY_URL}/api/proxy/k/search?${searchParamsWithCursor}`
      const { data } = await fetchWithErrorHandling<GETProxyKSearchResponse>(url)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
