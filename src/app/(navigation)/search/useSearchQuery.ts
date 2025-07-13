import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETProxyKSearchResponse } from '@/app/api/proxy/k/search/route'
import { QueryKeys } from '@/constants/query'
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

  return useSuspenseInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: QueryKeys.search(whitelisted),
    queryFn: ({ pageParam }) => {
      const searchParamsWithCursor = new URLSearchParams(whitelisted)
      if (pageParam) {
        searchParamsWithCursor.set('next-id', pageParam.toString())
        searchParamsWithCursor.delete('skip')
      }
      return searchMangas(searchParamsWithCursor)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
