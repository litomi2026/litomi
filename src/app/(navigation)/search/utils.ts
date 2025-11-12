import { KOREAN_TO_ENGLISH_QUERY_KEYS } from './constants'

export function formatDate(timestamp: number | string) {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatNumber(num: number | string | null | undefined, defaultValue: string) {
  if (!num) return defaultValue
  return Number(num).toLocaleString('ko-KR')
}

export function getWordAtCursor(text: string, cursorPosition: number): { word: string; start: number; end: number } {
  // Handle edge cases
  if (!text || cursorPosition < 0) {
    return { word: '', start: 0, end: 0 }
  }

  // Find word boundaries
  let start = cursorPosition
  let end = cursorPosition

  // Move start backward to find the beginning of the word
  while (start > 0 && text[start - 1] !== ' ') {
    start--
  }

  // Move end forward to find the end of the word
  while (end < text.length && text[end] !== ' ') {
    end++
  }

  const word = text.slice(start, end).toLowerCase()
  return { word, start, end }
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
