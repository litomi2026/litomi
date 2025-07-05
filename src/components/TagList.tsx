'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { Tag } from '@/types/manga'

import { toggleSearchFilter } from './card/utils'

const tagStyles = {
  male: 'bg-blue-800',
  female: 'bg-red-800',
  mixed: 'bg-purple-800',
  other: 'bg-zinc-700',
  '': 'bg-zinc-900',
}

type Props = {
  className: string
  tags: Tag[]
  clickable?: boolean
}

export default memo(TagList)

function TagList({ className, tags, clickable = false }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentQuery = searchParams.get('query') ?? ''
  const isSearchPage = pathname === '/search'

  return (
    <ul
      className={`[&_a]:rounded [&_a]:px-1 [&_a]:text-foreground [&_a]:hover:underline [&_a]:active:opacity-80 [&_a]:transition [&_a]:block [&_a]:aria-pressed:ring-2 [&_a]:aria-pressed:ring-brand-end [&_a]:aria-disabled:pointer-events-none ${className}`}
    >
      {tags.map(({ category, value, label }) => {
        const tagColor = tagStyles[category]

        const newQuery = toggleSearchFilter(currentQuery, category, value, !isSearchPage)
        const newSearchParams = new URLSearchParams({ query: newQuery })
        const filterPattern = `${category}:${value}`
        const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const isActive = currentQuery ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery) : false

        return (
          <Link
            aria-disabled={!clickable}
            aria-pressed={isActive}
            className={tagColor}
            href={clickable ? `/search?${newSearchParams}` : ''}
            key={`${category}:${value}`}
          >
            {label}
          </Link>
        )
      })}
    </ul>
  )
}
