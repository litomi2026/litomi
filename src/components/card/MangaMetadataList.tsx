'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { toggleSearchFilter } from './utils'

type Props = {
  label: string
  values: string[]
  filterType: string
  className?: string
}

export default memo(MangaMetadataList)

function MangaMetadataList({ label, values, filterType, className = '' }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentQuery = searchParams.get('query') ?? ''
  const isSearchPage = pathname === '/search'

  return (
    <div
      className={`flex gap-1 [&_a]:px-0.5 [&_a]:first:pl-0 [&_a]:last:pr-0 [&_a]:hover:underline [&_a]:focus:underline [&_a]:aria-pressed:text-brand-end [&_a]:aria-pressed:font-semibold ${className}`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <ul className="break-all">
        {values.map((value, idx) => {
          const newQuery = toggleSearchFilter(currentQuery, filterType, value, !isSearchPage)
          const newSearchParams = new URLSearchParams(searchParams)
          if (newQuery) {
            newSearchParams.set('query', newQuery)
          } else {
            newSearchParams.delete('query')
          }
          const filterPattern = `${filterType}:${value.replaceAll(' ', '_')}`
          const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const isActive = currentQuery
            ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery)
            : false

          return (
            <Link aria-pressed={isActive} href={`/search?${newSearchParams}`} key={value}>
              {value.replaceAll('_', ' ')}
              {idx < values.length - 1 && ','}
            </Link>
          )
        })}
      </ul>
    </div>
  )
}
