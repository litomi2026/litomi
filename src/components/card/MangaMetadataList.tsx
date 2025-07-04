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
    <div className={`flex gap-1 ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <div className="break-all">
        {items.map((item, idx) => {
          const newQuery = toggleSearchFilter(currentQuery, filterType, item, !isSearchPage)
          const normalizedValue = item.replaceAll(' ', '_')
          const filterPattern = `${filterType}:${normalizedValue}`
          const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const isActive = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery)

          return (
            <Link
              className={`px-0.5 first:pl-0 last:pr-0 hover:underline focus:underline ${isActive ? 'text-brand-end font-semibold' : ''}`}
              href={`/search?query=${encodeURIComponent(newQuery)}`}
              key={item}
            >
              {item.replaceAll('_', ' ')}
              {idx < items.length - 1 && ','}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
