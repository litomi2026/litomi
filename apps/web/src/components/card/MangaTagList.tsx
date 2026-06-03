'use client'

import type { CensorshipItem } from '@litomi/contracts'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { MangaTag } from '@litomi/domain/manga/model'
import { useState } from 'react'

import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'

import MangaTagLink from './MangaTagLink'
import { getSearchFilter } from './searchFilter'
import TagOptionsSheet from './TagOptionsSheet'

type Props = {
  className?: string
  searchParams?: URLSearchParams
  tags: MangaTag[]
}

export default function MangaTagList({ className = '', searchParams, tags }: Props) {
  const [selectedTag, setSelectedTag] = useState<MangaTag | null>(null)
  const { data: censorshipsMap } = useCensorshipsMapQuery()

  return (
    <>
      <ul className={`flex flex-wrap gap-1 ${className}`}>
        {tags.map((tag) => {
          const filterPattern = `${tag.category}:${tag.value}`
          const { href, isActive } = getSearchFilter(filterPattern, searchParams)
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
