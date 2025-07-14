import { useQuery } from '@tanstack/react-query'

import { GETSearchSuggestionsResponse, queryBlacklist } from '@/app/api/search/suggestions/schema'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'

import { MIN_SUGGESTION_QUERY_LENGTH } from './constants'

type Props = {
  query: string
}

export async function fetchSearchSuggestions(query: string, locale: string) {
  const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}&locale=${locale}`)
  return res.json()
}

export default function useSearchSuggestionsQuery({ query }: Readonly<Props>) {
  const locale = useLocaleFromCookie()

  return useQuery<GETSearchSuggestionsResponse>({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchSearchSuggestions(query, locale),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH && !queryBlacklist.some((regex) => regex.test(query)),
    placeholderData: (previousData) => previousData,
  })
}
