'use client'

import Link from 'next/link'
import { memo } from 'react'

import { useSearchFilter } from '@/components/card/useSearchFilter'

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

export default memo(MangaTagLink)

function MangaTagLink({ category, value, label }: Props) {
  const tagColor = tagStyles[category] ?? 'bg-zinc-900'
  const { href, isActive } = useSearchFilter(`${category}:${value}`)

  return (
    <Link
      aria-current={isActive}
      className={`rounded px-1 text-foreground transition break-all hover:underline focus:underline active:opacity-80 aria-current:ring-2 aria-current:ring-brand-end ${tagColor}`}
      href={href}
    >
      <MangaTagLabel>{label}</MangaTagLabel>
    </Link>
  )
}
