'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  title: string
}

export default function MangaTitle({ title }: Props) {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')

  const highlightedTitle = useMemo(() => {
    if (!query) {
      return title
    }

    const searchTerms = query.split(/\s+/).filter((term) => term && !term.includes(':'))

    if (searchTerms.length === 0) {
      return title
    }

    const pattern = searchTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
    const regex = new RegExp(`(${pattern})`, 'gi')
    const parts = title.split(regex).filter(Boolean)
    const lowerSearchTerms = new Set(searchTerms.map((t) => t.toLowerCase()))

    return (
      <>
        {parts.map((part, index) => {
          const isHighlight = part && lowerSearchTerms.has(part.toLowerCase())
          return isHighlight ? (
            <span className="text-brand" key={index}>
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        })}
      </>
    )
  }, [query, title])

  return highlightedTitle
}
