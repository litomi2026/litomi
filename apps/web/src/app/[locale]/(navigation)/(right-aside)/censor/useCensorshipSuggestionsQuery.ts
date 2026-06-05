'use client'

import type { GETSearchSuggestionsResponse } from '@litomi/contracts'

import { MAX_SEARCH_SUGGESTIONS, MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

import type { CensorshipSuggestion } from './useCensorshipSuggestions'

import { CENSORSHIP_CATEGORIES, CENSORSHIP_KEY_MESSAGE_PATHS, DEFAULT_CENSORSHIP_VALUES } from './constants'

type Options = {
  query: string
  apiSuggestions: GETSearchSuggestionsResponse
  blindTagSuggestions: CensorshipSuggestion[]
}

type Params = {
  query: string
  locale: string
}

type Props = {
  query: string
}

export async function fetchCensorshipSuggestions({ query, locale }: Params) {
  const params = new URLSearchParams({ locale, query })
  const url = withQuery('/api/v1/search/suggestions', params)
  const { data } = await fetchAPIData<GETSearchSuggestionsResponse>(url)
  return data
}

export default function useCensorshipSuggestionsQuery({ query }: Props) {
  const locale = useLocale()
  const t = useTranslations('Censorship')
  const normalizedQuery = normalizeSearchText(query)

  const defaultSuggestions = CENSORSHIP_CATEGORIES.filter(({ defaultSuggestion }) => defaultSuggestion).map(
    ({ prefix, key }) => ({
      value: prefix,
      label: t(CENSORSHIP_KEY_MESSAGE_PATHS[key]),
    }),
  )

  const blindTagSuggestions = DEFAULT_CENSORSHIP_VALUES.map(({ value, messagePath }) => ({
    value,
    label: t(messagePath),
  }))

  const suggestionsQuery = useQuery({
    queryKey: QueryKeys.censorshipSuggestions(normalizedQuery, locale),
    queryFn: async () => {
      if (normalizedQuery.length < MIN_SUGGESTION_QUERY_LENGTH) {
        const suggestions = computeSuggestions({ query: normalizedQuery, apiSuggestions: [], blindTagSuggestions })
        return suggestions.length > 0 ? suggestions : defaultSuggestions
      }

      const apiSuggestions = await fetchCensorshipSuggestions({ query: normalizedQuery, locale })
      const suggestions = computeSuggestions({ query: normalizedQuery, apiSuggestions, blindTagSuggestions })
      return suggestions.length > 0 ? suggestions : defaultSuggestions
    },
    enabled: normalizedQuery.length > 0,
    placeholderData: (previousData) => previousData ?? defaultSuggestions,
  })

  return {
    ...suggestionsQuery,
    data: suggestionsQuery.data ?? defaultSuggestions,
  }
}

function computeSuggestions({ query, apiSuggestions, blindTagSuggestions }: Options) {
  if (!query) {
    return []
  }

  const seenValues = new Set<string>()
  const results: CensorshipSuggestion[] = []
  const shouldFetchFromApi = query.length >= MIN_SUGGESTION_QUERY_LENGTH

  function matchesSearch(s: CensorshipSuggestion): boolean {
    return normalizeSearchText(s.value).includes(query) || normalizeSearchText(s.label).includes(query)
  }

  function addUnique(suggestion: CensorshipSuggestion) {
    const normalizedValue = normalizeSearchText(suggestion.value)

    if (seenValues.has(normalizedValue)) {
      return
    }

    if (results.length >= MAX_SEARCH_SUGGESTIONS) {
      return
    }

    seenValues.add(normalizedValue)
    results.push(suggestion)
  }

  for (const blindTag of blindTagSuggestions) {
    if (matchesSearch(blindTag)) {
      addUnique(blindTag)
      if (results.length >= MAX_SEARCH_SUGGESTIONS) {
        break
      }
    }
  }

  if (shouldFetchFromApi && results.length < MAX_SEARCH_SUGGESTIONS) {
    for (const suggestion of apiSuggestions) {
      const hasPrefix = hasCensorshipPrefix(suggestion.value)
      const isTag = !hasPrefix && !suggestion.value.includes(':') && suggestion.label.includes(':')

      if (hasPrefix || isTag) {
        addUnique(suggestion)
        if (results.length >= MAX_SEARCH_SUGGESTIONS) {
          break
        }
      }
    }
  }

  return results
}

function hasCensorshipPrefix(value: string): boolean {
  const colonIndex = value.indexOf(':')

  if (colonIndex === -1) {
    return false
  }

  const prefix = value.slice(0, colonIndex + 1).toLowerCase()
  return CENSORSHIP_CATEGORIES.some((category) => category.prefix === prefix)
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}
