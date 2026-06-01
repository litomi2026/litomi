export const SEARCH_LANGUAGE_ALL = 'all'
export const DEFAULT_SEARCH_LANGUAGE = SEARCH_LANGUAGE_ALL
export const MAX_SEARCH_LANGUAGE_LENGTH = 32

const SEARCH_LANGUAGE_VALUE_PATTERN = /^[a-z][a-z_/]*$/

export function isSearchLanguage(value: string) {
  return value.length <= MAX_SEARCH_LANGUAGE_LENGTH && SEARCH_LANGUAGE_VALUE_PATTERN.test(value)
}
