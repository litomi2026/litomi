'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { toggleSearchFilter } from './utils'

type Props = {
  label: string
  items?: string[]
  filterType: string
  className?: string
}

export default memo(MangaMetadataList)

function MangaMetadataList({ label, items, filterType, className = '' }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (!items || items.length === 0) return null

  const currentQuery = searchParams.get('query') || ''
  const isSearchPage = pathname === '/search'

  return (
    <div
      className={`flex gap-1 [&_a]:px-0.5 [&_a]:first:pl-0 [&_a]:last:pr-0 [&_a]:hover:underline [&_a]:focus:underline [&_a]:aria-pressed:text-brand-end [&_a]:aria-pressed:font-semibold ${className}`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <div className="break-all">
        {items.map((item, idx) => {
          const newQuery = toggleSearchFilter(currentQuery, filterType, item, !isSearchPage)
          const searchParams = new URLSearchParams({ query: newQuery })
          const filterPattern = `${filterType}:${item.replaceAll(' ', '_')}`
          const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const isActive = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery)

          return (
            <Link aria-pressed={isActive} href={`/search?${searchParams}`} key={item}>
              {item.replaceAll('_', ' ')}
              {idx < items.length - 1 && ','}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
