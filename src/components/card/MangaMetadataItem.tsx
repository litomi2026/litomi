'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { toggleSearchFilter } from './utils'

type Props = {
  label: string
  value?: string
  filterType: string
  className?: string
}

export default memo(MangaMetadataItem)

function MangaMetadataItem({ label, value, filterType, className = '' }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (!value) return null

  const currentQuery = searchParams.get('query') || ''
  const isSearchPage = pathname === '/search'
  const newQuery = toggleSearchFilter(currentQuery, filterType, value, !isSearchPage)
  const newSearchParams = new URLSearchParams({ query: newQuery })
  const filterPattern = `${filterType}:${value.replaceAll(' ', '_')}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isActive = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery)

  return (
    <div className={`flex gap-1 ${className}`}>
      <span>{label}</span>
      <Link
        className={`hover:underline focus:underline ${isActive ? 'text-brand-end font-semibold' : ''}`}
        href={`/search?${newSearchParams}`}
      >
        {value}
      </Link>
    </div>
  )
}
