'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { toggleSearchFilter } from './card/utils'

const tagStyles = {
  male: 'bg-blue-700',
  female: 'bg-red-700',
  남: 'bg-blue-700',
  여: 'bg-red-700',
  mixed: 'bg-purple-700',
  혼합: 'bg-purple-700',
  other: 'bg-zinc-700',
  기타: 'bg-zinc-700',
}

type Props = {
  className: string
  tags: string[]
  clickable?: boolean
}

export default memo(TagList)

function TagList({ className, tags, clickable = false }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentQuery = searchParams.get('query') || ''
  const isSearchPage = pathname === '/search'

  return (
    <ul className={className}>
      {tags.map((tag) => {
        const [category, label] = tag.split(':')
        const tagStyle = label ? (tagStyles[category as keyof typeof tagStyles] ?? 'bg-zinc-900') : 'bg-zinc-700'
        const content = (label || category).replaceAll('_', ' ')
        const filterType = label ? category : 'other'

        if (clickable) {
          const newQuery = toggleSearchFilter(currentQuery, filterType, content, !isSearchPage)
          const normalizedValue = content.replaceAll(' ', '_')
          const filterPattern = `${filterType}:${normalizedValue}`
          const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const isActive = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`, 'i').test(currentQuery)

          return (
            <li
              className={`${tagStyle} hover:opacity-80 focus:opacity-80 transition-opacity ${isActive ? 'ring-2 ring-brand-end' : ''}`}
              key={tag}
            >
              <Link className="block" href={`/search?query=${encodeURIComponent(newQuery)}`}>
                {content}
              </Link>
            </li>
          )
        }

        return (
          <li className={tagStyle} key={tag}>
            {content}
          </li>
        )
      })}
    </ul>
  )
}
