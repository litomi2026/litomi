export function getKoreanSearchLink(filterType: string, value: string) {
  const query = `language:korean ${filterType}:${value.replaceAll(' ', '_')}`
  return `/search?query=${encodeURIComponent(query)}`
}

export function toggleSearchFilter(
  currentQuery: string,
  filterType: string,
  value: string,
  addLanguagePrefix: boolean = true,
): string {
  const filterPattern = `${filterType}:${value.replaceAll(' ', '_')}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const excapedRegex = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'gi')
  const newQuery = currentQuery.replace(excapedRegex, '$1').replace(/\s+/g, ' ').trim()

  if (newQuery !== currentQuery.trim()) {
    return newQuery
  }

  const needsLanguagePrefix = addLanguagePrefix && !currentQuery.includes('language:korean')
  const languagePrefix = needsLanguagePrefix ? 'language:korean ' : ''
  const separator = currentQuery.trim() ? ' ' : ''
  return `${languagePrefix}${currentQuery}${separator}${filterPattern}`.trim()
}
