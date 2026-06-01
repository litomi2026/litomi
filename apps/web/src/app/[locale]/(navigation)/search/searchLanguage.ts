import { DEFAULT_SEARCH_LANGUAGE, isSearchLanguage, SEARCH_LANGUAGE_ALL } from '@litomi/domain/search/language'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { LocalStorageKey } from '@/storage'
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

export function writeStoredSearchLanguage(language: string) {
  try {
    localStorage.setItem(LocalStorageKey.SEARCH_LANGUAGE, language)
  } catch {
    // localStorage를 사용할 수 없으면 게스트 기본값으로 남겨요.
  }
}
