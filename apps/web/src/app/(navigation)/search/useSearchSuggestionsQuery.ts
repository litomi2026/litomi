import type { GETSearchSuggestionsResponse } from '@litomi/contracts'

import { MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/constants/policy'
import { queryBlacklist } from '@litomi/domain/search/suggestion'
import { env } from '@litomi/env/client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

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
  const { data } = await fetchWithErrorHandling<GETSearchSuggestionsResponse>(url)
  return data
}

export default function useSearchSuggestionsQuery({ query }: Props) {
  const locale = getLocaleFromCookie()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchSearchSuggestions({ query, locale }),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH && !queryBlacklist.some((regex) => regex.test(query)),
    placeholderData: keepPreviousData,
  })
}
