'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { CensorshipItem } from '@/backend/api/v1/censorship'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import { MangaTag } from '@/types/manga'

import MangaTagLink from './MangaTagLink'
import TagOptionsSheet from './TagOptionsSheet'

type Props = {
  className?: string
  tags: MangaTag[]
}

export default function MangaTagList({ className = '', tags }: Readonly<Props>) {
  const [selectedTag, setSelectedTag] = useState<MangaTag | null>(null)
  const searchParams = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const { data: censorshipsMap } = useCensorshipsMapQuery()

  return (
    <>
      <ul className={`flex flex-wrap gap-1 ${className}`}>
        {tags.map((tag) => {
          const filterPattern = `${tag.category}:${tag.value}`
          const { href, isActive } = getSearchFilter(filterPattern, query, searchParams)
          const isCensored = checkIfLightCensored(tag.category, tag.value, censorshipsMap)

          return (
            <MangaTagLink
              category={tag.category}
              disabled={selectedTag !== null}
              href={href}
              isActive={isActive}
              isCensored={isCensored}
              key={filterPattern}
              label={tag.label}
              onLongPress={() => setSelectedTag(tag)}
              value={tag.value}
            />
          )
        })}
      </ul>

      {selectedTag && (
        <TagOptionsSheet
          category={selectedTag.category}
          isOpen
          label={selectedTag.label}
          onClose={() => setSelectedTag(null)}
          value={selectedTag.value}
        />
      )}
    </>
  )
}

function checkIfLightCensored(category: string, value: string, censorships: Map<string, CensorshipItem> | undefined) {
  if (!censorships) {
    return false
  }

  const categoryKey = mapTagCategoryToCensorshipKey(category)
  const matched = censorships.get(`${categoryKey}:${value}`) || censorships.get(`${CensorshipKey.TAG}:${value}`)

  return matched?.level === CensorshipLevel.LIGHT
}

function getSearchFilter(filterPattern: string, query: string, searchParams: URLSearchParams) {
  const escapedPattern = filterPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordBoundaryRegex = new RegExp(`\\b${escapedPattern}\\b`)
  const isActive = wordBoundaryRegex.test(query)

  const newQuery = isActive
    ? query.replace(wordBoundaryRegex, '').replace(/\s+/g, ' ').trim()
    : [query, filterPattern].filter(Boolean).join(' ')

  const newSearchParams = new URLSearchParams(searchParams)
  newSearchParams.set('query', newQuery)

  return {
    href: `/search?${newSearchParams}`,
    isActive,
  }
}

function mapTagCategoryToCensorshipKey(category: string) {
  switch (category) {
    case 'female':
      return CensorshipKey.TAG_CATEGORY_FEMALE
    case 'male':
      return CensorshipKey.TAG_CATEGORY_MALE
    case 'mixed':
      return CensorshipKey.TAG_CATEGORY_MIXED
    case 'other':
      return CensorshipKey.TAG_CATEGORY_OTHER
    default:
      return ''
  }
}
