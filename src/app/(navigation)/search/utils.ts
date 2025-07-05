import { KOREAN_TO_ENGLISH_QUERY_KEYS, SEARCH_LABEL_TO_VALUE_MAP } from './constants'

/**
 * Translates user-friendly search labels to API values
 * Example: "series:naruto" -> "parody:naruto"
 */
export function convertQueryKey(query?: string) {
  if (!query) return

  let translatedQuery = query

  Object.entries(SEARCH_LABEL_TO_VALUE_MAP).forEach(([label, value]) => {
    const regex = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    translatedQuery = translatedQuery.replace(regex, value)
  })

  return translatedQuery
}

/**
 * Translates Korean query keys to English
 * Example: "여성:tag" -> "female:tag"
 */
export function translateKoreanToEnglish(query?: string) {
  if (!query) return query

  let translatedQuery = query

  Object.entries(KOREAN_TO_ENGLISH_QUERY_KEYS).forEach(([korean, english]) => {
    const regex = new RegExp(`(^|\\s)${korean}(?=:)`, 'gi')
    translatedQuery = translatedQuery.replace(regex, `$1${english}`)
  })

  return translatedQuery
}
