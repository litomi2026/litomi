import useSearchSuggestionsQuery from './useSearchSuggestionsQuery'

const LANGUAGE_PREFIX = 'language:'
const LANGUAGE_SUGGESTION_LIMIT = 50

export default function useSearchLanguageOptions() {
  const { data: suggestions = [] } = useSearchSuggestionsQuery({
    query: LANGUAGE_PREFIX,
    limit: LANGUAGE_SUGGESTION_LIMIT,
  })

  return suggestions.map((suggestion) => ({
    value: suggestion.value.slice(LANGUAGE_PREFIX.length),
    label: suggestion.label.split(':')[1],
  }))
}
