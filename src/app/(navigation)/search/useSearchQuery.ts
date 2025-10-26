import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETProxyKSearchResponse } from '@/app/api/proxy/k/search/route'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { whitelistSearchParams } from '@/utils/param'
import { handleResponseError } from '@/utils/react-query-error'

import { SEARCH_PAGE_SEARCH_PARAMS } from './constants'

export async function searchMangas(searchParams: URLSearchParams) {
  const response = await fetch(`/api/proxy/k/search?${searchParams}`)
  return handleResponseError<GETProxyKSearchResponse>(response)
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PAGE_SEARCH_PARAMS)
  const locale = useLocaleFromCookie()

  return useInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(whitelisted, locale),
    queryFn: ({ pageParam }) => {
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

      return searchMangas(searchParamsWithCursor)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
