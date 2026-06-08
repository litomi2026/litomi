import type { GETSearchSuggestionsResponse } from '@litomi/contracts'

import { MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { queryBlacklist } from '@litomi/domain/search/suggestion'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

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

  const url = withQuery('/api/v1/search/suggestions', searchParams)
  const { data } = await fetchAPIData<GETSearchSuggestionsResponse>(url, { credentials: 'omit' })
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
