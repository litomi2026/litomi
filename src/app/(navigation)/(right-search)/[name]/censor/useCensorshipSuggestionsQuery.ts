'use client'

import { useQuery } from '@tanstack/react-query'

import type { GETSearchSuggestionsResponse } from '@/backend/api/v1/search/suggestion'

import { DEFAULT_SUGGESTIONS } from '@/constants/json'
import { MAX_SEARCH_SUGGESTIONS, MIN_SUGGESTION_QUERY_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import type { CensorshipSuggestion } from './useCensorshipSuggestions'

import { BLIND_TAG_SUGGESTIONS, CENSORSHIP_PREFIX_SET } from './constants'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  query: string
  apiSuggestions: GETSearchSuggestionsResponse
}

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
    queryKey: QueryKeys.censorshipSuggestions(query, locale),
    queryFn: async () => {
      if (query.length < MIN_SUGGESTION_QUERY_LENGTH) {
        return computeSuggestions({ query, apiSuggestions: [] })
      }

      const apiSuggestions = await fetchCensorshipSuggestions({ query, locale })
      return computeSuggestions({ query, apiSuggestions })
    },
    enabled: query.length > 0,
    placeholderData: (previousData) => previousData ?? DEFAULT_SUGGESTIONS,
  })
}

function computeSuggestions({ query, apiSuggestions }: Options) {
  if (!query) {
    return DEFAULT_SUGGESTIONS
  }

  const seenValues = new Set<string>()
  const results: CensorshipSuggestion[] = []
  const normalizedQuery = query.toLowerCase()
  const shouldFetchFromApi = normalizedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH

  function matchesSearch(s: CensorshipSuggestion): boolean {
    if (s.value.includes(normalizedQuery)) {
      return true
    }
    return s.label.includes(normalizedQuery)
  }

  // Helper for adding unique suggestions - O(1) per check
  function addUnique(suggestion: CensorshipSuggestion): boolean {
    if (seenValues.has(suggestion.value)) {
      return false
    }
    if (results.length >= MAX_SEARCH_SUGGESTIONS) {
      return false
    }

    seenValues.add(suggestion.value)
    results.push(suggestion)
    return true
  }

  // 1. Add matching blind tags first (priority) - O(b) where b = blind tags count
  for (const blindTag of BLIND_TAG_SUGGESTIONS) {
    if (matchesSearch(blindTag)) {
      if (!addUnique(blindTag)) {
        break
      }
    }
  }

  // 2. Filter and add API suggestions - O(a) where a = api suggestions count
  if (shouldFetchFromApi && results.length < MAX_SEARCH_SUGGESTIONS) {
    for (const suggestion of apiSuggestions) {
      if (!matchesSearch(suggestion)) {
        continue
      }

      // Check if it's a valid censorship suggestion
      const hasPrefix = hasCensorshipPrefix(suggestion.value)
      const isTag = !hasPrefix && !suggestion.value.includes(':') && suggestion.label.includes(':')

      if (hasPrefix || isTag) {
        if (!addUnique(suggestion)) {
          break
        }
      }
    }
  }

  if (results.length > 0) {
    return results
  }

  return DEFAULT_SUGGESTIONS
}

// Helper to check if value has censorship prefix - O(k) where k is prefix length (max 10)
function hasCensorshipPrefix(value: string): boolean {
  const colonIndex = value.indexOf(':')
  if (colonIndex === -1) {
    return false
  }
  return CENSORSHIP_PREFIX_SET.has(value.slice(0, colonIndex + 1))
}
