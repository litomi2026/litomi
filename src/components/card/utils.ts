export function toggleSearchFilter(currentQuery: string, filterType: string, value: string): string {
  const filterPattern = `${filterType}:${value.replaceAll(' ', '_')}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const excapedRegex = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'gi')
  const newQuery = currentQuery.replace(excapedRegex, '$1').replace(/\s+/g, ' ').trim()

  if (newQuery !== currentQuery.trim()) {
    return newQuery
  }

  const separator = currentQuery.trim() ? ' ' : ''
  return `${currentQuery}${separator}${filterPattern}`.trim()
}
