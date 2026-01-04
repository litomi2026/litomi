'use client'

import { useQuery } from '@tanstack/react-query'

import type { GETSearchSuggestionsResponse } from '@/backend/api/v1/search/suggestion'

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

export async function fetchCensorshipSuggestions({ query, locale }: Params) {
  const params = new URLSearchParams({ query })

  if (locale) {
    params.set('locale', locale)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/suggestions?${params}`
  const { data } = await fetchWithErrorHandling<GETSearchSuggestionsResponse>(url)
  return data
}

export default function useCensorshipSuggestionsQuery({ query }: Props) {
  const locale = getLocaleFromCookie()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchCensorshipSuggestions({ query, locale }),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH,
  })
}
