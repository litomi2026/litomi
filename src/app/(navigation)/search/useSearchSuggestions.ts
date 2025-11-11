import { useMemo, useState } from 'react'

import { MAX_SEARCH_SUGGESTIONS, MIN_SUGGESTION_QUERY_LENGTH } from '@/constants/policy'
import useDebouncedValue from '@/hook/useDebouncedValue'

import { SEARCH_SUGGESTIONS } from './constants'
import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const DEBOUNCE_MS = 300
const INITIAL_SELECTED_INDEX = -1

type Props = {
  keyword: string
}

export default function useSearchSuggestions({ keyword }: Readonly<Props>) {
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const debouncedKeyword = useDebouncedValue({
    value: keyword,
    delay: DEBOUNCE_MS,
  })

  const { data: suggestions = [], isLoading, isFetching } = useSearchSuggestionsQuery({ query: debouncedKeyword })

  const defaultSuggestions = useMemo(() => {
    if (keyword.length >= MIN_SUGGESTION_QUERY_LENGTH) {
      return []
    }

    if (keyword === '') {
      return SEARCH_SUGGESTIONS
    } else {
      return SEARCH_SUGGESTIONS.filter((filter) => filter.value.startsWith(keyword))
    }
  }, [keyword])

  const searchSuggestions = useMemo(() => {
    const a =
      suggestions.length > 0
        ? suggestions
        : SEARCH_SUGGESTIONS.filter((filter) => filter.value.startsWith(debouncedKeyword))

    const suggestionMap = new Map(a.map((suggestion) => [suggestion.label, suggestion]))
    return Array.from(suggestionMap.values()).slice(0, MAX_SEARCH_SUGGESTIONS)
  }, [debouncedKeyword, suggestions])

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
    searchSuggestions: keyword.length >= MIN_SUGGESTION_QUERY_LENGTH ? searchSuggestions : defaultSuggestions,
    showHeader: keyword === '',
    resetSelection,
    navigateSelection,
    isLoading,
    isFetching,
  }
}
