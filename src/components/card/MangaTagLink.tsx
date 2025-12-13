'use client'

import { useRouter } from 'next/navigation'

import useLongPress from '@/hook/useLongPress'

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
  href: string
  isActive: boolean
  isCensored: boolean
  onLongPress?: () => void
}

export default function MangaTagLink({ category, value, label, href, isActive, isCensored, onLongPress }: Props) {
  const router = useRouter()
  const tagColor = tagStyles[category] ?? 'bg-zinc-900'

  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress?.(),
    onClick: () => {
      console.log('👀 - MangaTagLink - href:', href)
      router.push(href)
    },
  })

  return (
    <span
      aria-current={isActive || undefined}
      className={`rounded px-1 text-foreground transition break-all select-none cursor-pointer hover:underline focus:underline active:opacity-80 aria-current:ring-2 aria-current:ring-brand data-censored:line-through data-censored:opacity-70 ${tagColor}`}
      data-censored={isCensored || undefined}
      role="link"
      title={isCensored ? '검열됨' : value}
      {...longPressHandlers}
    >
      <MangaTagLabel>{label}</MangaTagLabel>
    </span>
  )
}
