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
  const normalizedValue = value.replaceAll(' ', '_')
  const filterPattern = `${filterType}:${normalizedValue}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const filterRegex = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i')

  if (filterRegex.test(currentQuery)) {
    return currentQuery.replace(filterRegex, '$1').replace(/\s+/g, ' ').trim()
  } else {
    const needsLanguagePrefix = addLanguagePrefix && !currentQuery.includes('language:korean')
    const languagePrefix = needsLanguagePrefix ? 'language:korean ' : ''
    const separator = currentQuery.trim() ? ' ' : ''
    return `${languagePrefix}${currentQuery}${separator}${filterPattern}`.trim()
  }
}
