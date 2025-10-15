'use client'

import { useSearchParams } from 'next/navigation'

export function useSearchFilter(filterPattern: string) {
  const searchParams = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const isActive = query.includes(filterPattern)

  const newQuery = isActive
    ? query.replace(filterPattern, '').replace(/\s+/g, ' ').trim()
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
