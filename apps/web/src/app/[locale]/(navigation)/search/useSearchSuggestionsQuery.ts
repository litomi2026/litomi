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
  query: string
  locale: string
}

type Props = {
  query: string
}

export async function fetchSearchSuggestions({ query, locale }: Params) {
  const searchParams = new URLSearchParams({ query })

  if (locale) {
    searchParams.set('locale', locale)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/search/suggestions?${searchParams}`
  const { data } = await fetchAPIData<GETSearchSuggestionsResponse>(url)
  return data
}

export default function useSearchSuggestionsQuery({ query }: Props) {
  const locale = useLocale()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchSearchSuggestions({ query, locale }),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH && !queryBlacklist.some((regex) => regex.test(query)),
    placeholderData: keepPreviousData,
  })
}
