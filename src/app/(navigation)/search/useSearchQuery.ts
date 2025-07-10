import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETProxyKSearchResponse } from '@/app/api/proxy/k/search/route'
import { whitelistSearchParams } from '@/utils/param'
import { handleResponseError, shouldRetryError } from '@/utils/react-query-error'

import { SEARCH_PARAMS_WHITELIST } from './constants'

export function getSearchQueryKey(searchParams: URLSearchParams) {
  return ['search', Object.fromEntries(searchParams)]
}

export async function searchMangas(searchParams: URLSearchParams) {
  const response = await fetch(`/api/proxy/k/search?${searchParams}`)
  return handleResponseError<GETProxyKSearchResponse>(response)
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PARAMS_WHITELIST)

  return useSuspenseInfiniteQuery<GETProxyKSearchResponse, Error>({
    queryKey: getSearchQueryKey(whitelisted),
    queryFn: ({ pageParam }) => {
      const searchParamsWithCursor = new URLSearchParams(whitelisted)
      if (pageParam) {
        searchParamsWithCursor.set('next-id', String(pageParam))
        searchParamsWithCursor.delete('skip')
      }
      return searchMangas(searchParamsWithCursor)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
  })
}
