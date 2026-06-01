import type { GETSearchSuggestionsResponse } from '@litomi/contracts'

import { MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { queryBlacklist } from '@litomi/domain/search/suggestion'
import { env } from '@litomi/env/client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Params = {
  limit?: number
  query: string
  locale: string
}

type Props = {
  limit?: number
  query: string
}

export async function fetchSearchSuggestions({ limit, query, locale }: Params) {
  const searchParams = new URLSearchParams({ locale, query })

  if (limit) {
    searchParams.set('limit', limit.toString())
  }

  const url = new URL('/api/v1/search/suggestions', NEXT_PUBLIC_API_ORIGIN)
  url.search = searchParams.toString()
  const { data } = await fetchAPIData<GETSearchSuggestionsResponse>(url)
  return data
}

export default function useSearchSuggestionsQuery({ limit, query }: Props) {
  const locale = useLocale()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale, limit),
    queryFn: () => fetchSearchSuggestions({ limit, query, locale }),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH && !queryBlacklist.some((regex) => regex.test(query)),
    placeholderData: keepPreviousData,
  })
}
