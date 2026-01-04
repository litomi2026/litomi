import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { GETSearchSuggestionsResponse } from '@/backend/api/v1/search/suggestion'

import { queryBlacklist } from '@/backend/api/v1/search/suggestion/constant'
import { MIN_SUGGESTION_QUERY_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

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

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/suggestions?${searchParams}`
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
