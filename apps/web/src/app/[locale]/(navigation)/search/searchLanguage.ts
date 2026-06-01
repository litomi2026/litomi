import { DEFAULT_SEARCH_LANGUAGE, isSearchLanguage, SEARCH_LANGUAGE_ALL } from '@litomi/domain/search/language'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { LocalStorageKey } from '@/storage'

const PREFIX = 'language:'
const LANGUAGE_FILTER_QUERY_PATTERN = new RegExp(String.raw`(?:^|\s)${PREFIX}([^\s]*)`, 'i')
const LANGUAGE_FILTER_TOKEN_PATTERN = new RegExp(String.raw`(?:^|\s)${PREFIX}[^\s]*`, 'gi')

type MeWithSearchLanguage = {
  settings: {
    searchLanguage: string
  }
}

export function addLanguageFilterIfMissing(query: string | null, language: string) {
  const trimmedQuery = query?.trim() ?? ''

  if (language === SEARCH_LANGUAGE_ALL || LANGUAGE_FILTER_QUERY_PATTERN.test(trimmedQuery)) {
    return trimmedQuery
  }

  return trimmedQuery ? `${trimmedQuery} ${PREFIX}${language}` : `${PREFIX}${language}`
}

export function getLanguageFilter(query: string | null | undefined) {
  const match = query?.match(LANGUAGE_FILTER_QUERY_PATTERN)
  const language = match?.[1] ? normalizeValue(match[1]) : ''
  return language && isSearchLanguage(language) ? language : ''
}

export function readPreferredSearchLanguage(me: MeWithSearchLanguage | null | undefined) {
  if (me) {
    return me.settings.searchLanguage
  }

  return me === null ? readStoredSearchLanguage() : DEFAULT_SEARCH_LANGUAGE
}

export function readStoredSearchLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_SEARCH_LANGUAGE
  }

  try {
    const language = normalizeValue(localStorage.getItem(LocalStorageKey.SEARCH_LANGUAGE) ?? '')
    return language && isSearchLanguage(language) ? language : DEFAULT_SEARCH_LANGUAGE
  } catch {
    return DEFAULT_SEARCH_LANGUAGE
  }
}

export function removeLanguageFilter(query: string | null | undefined) {
  return query?.replace(LANGUAGE_FILTER_TOKEN_PATTERN, '').trim()
}

export function setLanguageFilter(query: string | null, language: string | null | undefined) {
  const queryWithoutLanguage = removeLanguageFilter(query)

  if (!language || language === SEARCH_LANGUAGE_ALL) {
    return queryWithoutLanguage
  }

  return queryWithoutLanguage ? `${queryWithoutLanguage} ${PREFIX}${language}` : `${PREFIX}${language}`
}

export function writeStoredSearchLanguage(language: string) {
  try {
    localStorage.setItem(LocalStorageKey.SEARCH_LANGUAGE, language)
  } catch {
    // localStorage를 사용할 수 없으면 게스트 기본값으로 남겨요.
  }
}
