import { useMemo, useState } from 'react'

import { MAX_SEARCH_SUGGESTIONS } from '@/constants/policy'
import useDebouncedValue from '@/hook/useDebouncedValue'

import { MIN_SUGGESTION_QUERY_LENGTH, SEARCH_SUGGESTIONS, type SearchSuggestion } from './constants'
import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const DEBOUNCE_MS = 500
const INITIAL_SELECTED_INDEX = -1

type Props = {
  keyword: string
  limit?: number
}

export default function useSearchSuggestions({ keyword, limit = MAX_SEARCH_SUGGESTIONS }: Readonly<Props>) {
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const debouncedKeyword = useDebouncedValue({
    value: keyword.length >= MIN_SUGGESTION_QUERY_LENGTH ? keyword : '',
    delay: DEBOUNCE_MS,
  })

  const { data: suggestions = [] } = useSearchSuggestionsQuery({ query: debouncedKeyword })

  const searchSuggestions = useMemo(() => {
    if (debouncedKeyword === '') {
      return SEARCH_SUGGESTIONS.slice(0, limit)
    }

    const matchedFilters = SEARCH_SUGGESTIONS.filter(
      (filter) => filter.value.startsWith(debouncedKeyword) && filter.value !== debouncedKeyword,
    )

    if (debouncedKeyword.length < MIN_SUGGESTION_QUERY_LENGTH) {
      return matchedFilters.slice(0, limit)
    }

    const a = suggestions.length > 0 ? suggestions : matchedFilters
    const b = a.map((suggestion) => [suggestion.label, suggestion] as const)
    const suggestionMap = new Map<string, SearchSuggestion>(b)

    return Array.from(suggestionMap.values()).slice(0, limit)
  }, [debouncedKeyword, suggestions, limit])

  const resetSelection = () => {
    setSelectedIndex(INITIAL_SELECTED_INDEX)
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
    showHeader: debouncedKeyword === '',
    resetSelection,
    navigateSelection,
  }
}
