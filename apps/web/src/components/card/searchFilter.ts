export function getSearchFilter(filterPattern: string, searchParams = '') {
  const params = new URLSearchParams(searchParams)
  const query = params.get('query') ?? ''
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordBoundaryRegex = new RegExp(`\\b${escapedPattern}\\b`)
  const isActive = wordBoundaryRegex.test(query)

  const newQuery = isActive
    ? query.replace(wordBoundaryRegex, '').replace(/\s+/g, ' ').trim()
    : query
      ? `${query} ${filterPattern}`
      : filterPattern

  params.set('query', newQuery)

  return {
    href: `/search?${params}`,
    isActive,
  }
}
