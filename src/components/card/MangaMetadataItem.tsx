'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import MangaMetadataLabel from './MangaMetadataLabel'
import { toggleSearchFilter } from './utils'

type Props = {
  value: string
  filterType: string
}

export default memo(MangaMetadataItem)

function MangaMetadataItem({ value, filterType }: Readonly<Props>) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentQuery = searchParams.get('query') ?? ''
  const isSearchPage = pathname === '/search'
  const newQuery = toggleSearchFilter(currentQuery, filterType, value, !isSearchPage)
  const newSearchParams = new URLSearchParams(searchParams)
  if (newQuery) {
    newSearchParams.set('query', newQuery)
  } else {
    newSearchParams.delete('query')
  }
  const filterPattern = `${filterType}:${value.replaceAll(' ', '_')}`
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isActive = currentQuery ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery) : false

  return (
    <Link
      aria-pressed={isActive}
      className="hover:underline focus:underline aria-pressed:text-brand-end aria-pressed:font-semibold"
      href={`/search?${newSearchParams}`}
    >
      <MangaMetadataLabel>{value}</MangaMetadataLabel>
    </Link>
  )
}
