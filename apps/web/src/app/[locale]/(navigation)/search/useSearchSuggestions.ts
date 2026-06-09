import { MAX_SEARCH_SUGGESTIONS, MIN_SUGGESTION_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { useTranslations } from 'next-intl'

import useDebouncedValue from '@/hook/useDebouncedValue'

import { SEARCH_SUGGESTIONS } from './constants'
import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const DEBOUNCE_MS = 300

type Props = {
  keyword: string
}

export default function useSearchSuggestions({ keyword }: Props) {
  const t = useTranslations('Search.suggestions')

  const debouncedKeyword = useDebouncedValue({
    value: keyword,
    delay: DEBOUNCE_MS,
  })

  const { data: suggestions = [], isLoading, isFetching } = useSearchSuggestionsQuery({ query: debouncedKeyword })

  const staticSuggestions = SEARCH_SUGGESTIONS.map((value) => ({
    value,
    label: t(`labels.${value}`),
  }))

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

  return {
    searchSuggestions: getSearchSuggestions(),
    isLoading,
    isFetching,
  }
}
