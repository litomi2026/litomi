import { SEARCH_FILTERS } from './searchConstants'

/**
 * Translates user-friendly search labels to API values
 * Example: "series:naruto" -> "parody:naruto"
 */
export function convertQueryKey(query?: string) {
  if (!query) return

  let translatedQuery = query

  const labelToValueMap = SEARCH_FILTERS.reduce(
    (map, filter) => {
      if (filter.value) {
        map[filter.label] = filter.value
      }
      return map
    },
    {} as Record<string, string>,
  )

  Object.entries(labelToValueMap).forEach(([label, value]) => {
    const regex = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    translatedQuery = translatedQuery.replace(regex, value)
  })

  return translatedQuery
}
