import { useMemo, useState } from 'react'

import useDebouncedValue from '@/hook/useDebouncedValue'

import { MIN_SUGGESTION_QUERY_LENGTH, SEARCH_SUGGESTIONS, type SearchSuggestion } from './constants'
import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const DEBOUNCE_MS = 500
const MAX_SUGGESTIONS = 15

export default function useSearchSuggestions(keyword: string) {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const debouncedQuery = useDebouncedValue({
    value: keyword.length >= MIN_SUGGESTION_QUERY_LENGTH ? keyword : '',
    delay: DEBOUNCE_MS,
  })

  const { data: suggestions = [] } = useSearchSuggestionsQuery({ query: debouncedQuery })

  const searchSuggestions = useMemo(() => {
    if (keyword === '') {
      return SEARCH_SUGGESTIONS
    }

    const matchedFilters = SEARCH_SUGGESTIONS.filter(
      (filter) => filter.value.startsWith(keyword) && filter.value !== keyword,
    )

    if (keyword.length < MIN_SUGGESTION_QUERY_LENGTH) {
      return matchedFilters
    }

    const a = suggestions.length > 0 ? suggestions : matchedFilters
    const b = a.map((suggestion) => [suggestion.label, suggestion] as const)
    const suggestionMap = new Map<string, SearchSuggestion>(b)

    return Array.from(suggestionMap.values()).slice(0, MAX_SUGGESTIONS)
  }, [keyword, suggestions])

  const showHeader = keyword === ''

  const resetSelection = () => {
    setSelectedIndex(-1)
  }

  const navigateSelection = (direction: 'down' | 'up') => {
    if (direction === 'down') {
      setSelectedIndex((prev) => (prev < searchSuggestions.length - 1 ? prev + 1 : 0))
    } else {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchSuggestions.length - 1))
    }
  }

  return {
    selectedIndex,
    setSelectedIndex,
    searchSuggestions,
    showHeader,
    resetSelection,
    navigateSelection,
  }
}
