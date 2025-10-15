'use client'

import { useSearchParams } from 'next/navigation'

import { toggleSearchFilter } from '@/components/card/utils'

export function useSearchFilter(filterType: string, value: string) {
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('query') ?? ''
  const filterPattern = `${filterType}:${value}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isActive = currentQuery ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery) : false
  const newQuery = toggleSearchFilter(currentQuery, filterType, value)
  const newSearchParams = new URLSearchParams(searchParams)

  if (newQuery) {
    newSearchParams.set('query', newQuery)
  } else {
    newSearchParams.delete('query')
  }

  return {
    href: `/search?${newSearchParams}`,
    isActive,
  }
}
