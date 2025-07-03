import { useMemo, useState } from 'react'

import { SEARCH_FILTERS } from './searchConstants'

export default function useSearchSuggestions(keyword: string) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const filteredSuggestions = useMemo(() => {
    const lastWord = keyword.split(' ').pop()?.toLowerCase() || ''
    if (lastWord === '') return SEARCH_FILTERS
    return SEARCH_FILTERS.filter(
      (filter) => filter.label.toLowerCase().startsWith(lastWord) && lastWord !== filter.label,
    )
  }, [keyword])

  const showHeader = keyword.split(' ').pop() === ''

  const resetSelection = () => {
    setSelectedIndex(-1)
  }

  const navigateSelection = (direction: 'down' | 'up') => {
    if (direction === 'down') {
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0))
    } else {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
    }
  }

  return {
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    setSelectedIndex,
    filteredSuggestions,
    showHeader,
    resetSelection,
    navigateSelection,
  }
}
