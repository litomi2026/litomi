import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { GETSearchSuggestionsResponse } from '@/backend/api/v1/search/suggestion'

import { queryBlacklist } from '@/backend/api/v1/search/suggestion/constant'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { MIN_SUGGESTION_QUERY_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { handleResponseError } from '@/utils/react-query-error'

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

  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/suggestions?${searchParams}`)
  return handleResponseError<GETSearchSuggestionsResponse>(response)
}

export default function useSearchSuggestionsQuery({ query }: Props) {
  const locale = useLocaleFromCookie()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchSearchSuggestions({ query, locale }),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH && !queryBlacklist.some((regex) => regex.test(query)),
    placeholderData: keepPreviousData,
  })
}
