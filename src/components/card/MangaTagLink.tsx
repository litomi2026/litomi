'use client'

import Link from 'next/link'

import { CensorshipItem } from '@/backend/api/v1/censorship'
import { useSearchFilter } from '@/components/card/useSearchFilter'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'

import MangaTagLabel from './MangaTagLabel'

const tagStyles: Record<string, string> = {
  male: 'bg-blue-800',
  female: 'bg-red-800',
  mixed: 'bg-purple-800',
  other: 'bg-zinc-700',
}

type Props = {
  category: string
  value: string
  label: string
}

export default function MangaTagLink({ category, value, label }: Props) {
  const tagColor = tagStyles[category] ?? 'bg-zinc-900'
  const { href, isActive } = useSearchFilter(`${category}:${value}`)
  const { data: censorshipsMap } = useCensorshipsMapQuery()
  const isCensored = checkIfLightCensored(category, value, censorshipsMap)

  return (
    <Link
      aria-current={isActive}
      aria-invalid={isCensored}
      className={`rounded px-1 text-foreground transition break-all hover:underline focus:underline active:opacity-80 aria-current:ring-2 aria-current:ring-brand aria-invalid:line-through aria-invalid:opacity-70 ${tagColor}`}
      href={href}
      prefetch={false}
      title={isCensored ? '검열됨' : label}
    >
      <MangaTagLabel>{label}</MangaTagLabel>
    </Link>
  )
}

function checkIfLightCensored(category: string, value: string, censorships: Map<string, CensorshipItem> | undefined) {
  if (!censorships) {
    return false
  }

  const categoryKey = mapTagCategoryToCensorshipKey(category)
  const matched = censorships.get(`${categoryKey}:${value}`) || censorships.get(`${CensorshipKey.TAG}:${value}`)

  return matched && matched?.level === CensorshipLevel.LIGHT
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
