import { MAX_SEARCH_SUGGESTIONS, MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import useDebouncedValue from '@/hook/useDebouncedValue'

import { SEARCH_SUGGESTIONS } from './constants'
import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const DEBOUNCE_MS = 300
const INITIAL_SELECTED_INDEX = -1

type Props = {
  keyword: string
}

export default function useSearchSuggestions({ keyword }: Props) {
  const t = useTranslations('Search.suggestions')
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const debouncedKeyword = useDebouncedValue({
    value: keyword,
    delay: DEBOUNCE_MS,
  })

  const { data: suggestions = [], isLoading, isFetching } = useSearchSuggestionsQuery({ query: debouncedKeyword })

  const staticSuggestions = SEARCH_SUGGESTIONS.map((value) => ({
    value,
    label: t(`labels.${value}`),
  }))

  const searchSuggestions = getSearchSuggestions()

  function getSearchSuggestions() {
    if (keyword.length >= MIN_SUGGESTION_QUERY_LENGTH) {
      if (suggestions.length > 0) {
        return suggestions.slice(0, MAX_SEARCH_SUGGESTIONS)
      }

      return staticSuggestions
        .filter((suggestion) => suggestion.value.startsWith(debouncedKeyword))
        .slice(0, MAX_SEARCH_SUGGESTIONS)
    }

    if (keyword) {
      return staticSuggestions.filter((suggestion) => suggestion.value.startsWith(keyword))
    }

    return staticSuggestions
  }

  function resetSelection() {
    setSelectedIndex(INITIAL_SELECTED_INDEX)
  }

  function navigateSelection(direction: 'down' | 'up') {
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
    showHeader: keyword === '',
    resetSelection,
    navigateSelection,
    isLoading,
    isFetching,
  }
}
