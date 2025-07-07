import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { Manga } from '@/types/manga'
import { whitelistSearchParams } from '@/utils/param'
import { handleResponseError, shouldRetryError } from '@/utils/react-query-error'

import { SEARCH_PARAMS_WHITELIST } from './constants'

type SearchParams = {
  query?: string
  'min-view'?: number
  'max-view'?: number
  'min-page'?: number
  'max-page'?: number
  from?: number
  to?: number
  sort?: 'id_asc' | 'popular' | 'random'
  'next-id'?: string
  skip?: number
}

export function getSearchQueryKey(searchParams: SearchParams) {
  return ['search', searchParams]
}

export async function searchMangas(searchParams: URLSearchParams) {
  const response = await fetch(`/api/proxy/k/search?${searchParams}`)
  return handleResponseError<Manga[]>(response)
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PARAMS_WHITELIST)

  return useSuspenseQuery<Manga[] | undefined, Error>({
    queryKey: getSearchQueryKey(Object.fromEntries(whitelisted)),
    queryFn: () => searchMangas(whitelisted),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
  })
}
