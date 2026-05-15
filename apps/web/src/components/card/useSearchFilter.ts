'use client'

import { useSearchParams } from 'next/navigation'

export function useSearchFilter(filterPattern: string) {
  const searchParams = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordBoundaryRegex = new RegExp(`\\b${escapedPattern}\\b`)
  const isActive = wordBoundaryRegex.test(query)

  const newQuery = isActive
    ? query.replace(wordBoundaryRegex, '').replace(/\s+/g, ' ').trim()
    : query
      ? `${query} ${filterPattern}`
      : filterPattern

  const newSearchParams = new URLSearchParams(searchParams)
  newSearchParams.set('query', newQuery)

  return {
    href: `/search?${newSearchParams}`,
    isActive,
  }
}
