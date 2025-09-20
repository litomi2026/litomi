'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { memo } from 'react'

import MangaMetadataLabel from './MangaMetadataLabel'
import { toggleSearchFilter } from './utils'

type Props = {
  details: { value: string; label: string }[]
  filterType: string
  className?: string
}

export default memo(MangaMetadataList)

function MangaMetadataList({ details, filterType, className = '' }: Readonly<Props>) {
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('query') ?? ''

  return (
    <ul
      className={`break-all [&_a]:px-0.5 [&_a]:first:pl-0 [&_a]:last:pr-0 [&_a]:hover:underline [&_a]:focus:underline [&_a]:aria-current:text-brand-end [&_a]:aria-current:font-semibold ${className}`}
    >
      {details.map(({ value, label }, idx) => {
        const newQuery = toggleSearchFilter(currentQuery, filterType, value)
        const newSearchParams = new URLSearchParams(searchParams)
        if (newQuery) {
          newSearchParams.set('query', newQuery)
        } else {
          newSearchParams.delete('query')
        }
        const filterPattern = `${filterType}:${value}`
        const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const isActive = currentQuery ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery) : false

        return (
          <Link aria-current={isActive} href={`/search?${newSearchParams}`} key={value} prefetch={false}>
            <MangaMetadataLabel>
              {label}
              {idx < details.length - 1 && ','}
            </MangaMetadataLabel>
          </Link>
        )
      })}
    </ul>
  )
}
