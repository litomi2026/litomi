'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { MangaTag } from '@/types/manga'

import { toggleSearchFilter } from './card/utils'
import TagLabel from './TagLabel'

const tagStyles: Record<string, string> = {
  male: 'bg-blue-800',
  female: 'bg-red-800',
  mixed: 'bg-purple-800',
  other: 'bg-zinc-700',
}

type Props = {
  className: string
  tags: MangaTag[]
}

export default memo(TagList)

function TagList({ className, tags }: Readonly<Props>) {
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('query') ?? ''

  return (
    <ul
      className={`[&_a]:rounded [&_a]:px-1 [&_a]:text-foreground [&_a]:hover:underline [&_a]:focus:underline [&_a]:active:opacity-80 [&_a]:transition [&_a]:block [&_a]:aria-current:ring-2 [&_a]:aria-current:ring-brand-end [&_a]:aria-disabled:pointer-events-none ${className}`}
    >
      {tags.map(({ category, value, label }) => {
        const tagColor = tagStyles[category] ?? 'bg-zinc-900'
        const newQuery = toggleSearchFilter(currentQuery, category, value)
        const newSearchParams = new URLSearchParams(searchParams)
        if (newQuery) {
          newSearchParams.set('query', newQuery)
        } else {
          newSearchParams.delete('query')
        }
        const filterPattern = `${category}:${value}`
        const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const isActive = currentQuery ? new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery) : false

        return (
          <Link
            aria-current={isActive}
            className={tagColor}
            href={`/search?${newSearchParams}`}
            key={`${category}:${value}`}
          >
            <TagLabel className="p-0.5 w-5">{label}</TagLabel>
          </Link>
        )
      })}
    </ul>
  )
}
