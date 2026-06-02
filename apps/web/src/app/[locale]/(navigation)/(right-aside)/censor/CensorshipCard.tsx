'use client'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { Check, SquarePen } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type ChangeEvent, type MouseEvent, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import CensorshipEditForm from './CensorshipEditForm'
import { CENSORSHIP_KEY_MESSAGE_PATHS, CENSORSHIP_LEVELS } from './constants'

type Props = {
  censorship: {
    id: number
    key: CensorshipKey
    value: string
    level: CensorshipLevel
    createdAt: number
  }
  isSelected: boolean
  isDeleting?: boolean
  onToggleSelect: () => void
}

export default function CensorshipCard({ censorship, isSelected, isDeleting = false, onToggleSelect }: Props) {
  const { key, value, level, createdAt } = censorship
  const [isEditing, setIsEditing] = useState(false)
  const t = useTranslations('Censorship')
  const locale = useLocale()

  function handleEdit(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!isDeleting) {
      setIsEditing(true)
    }
  }

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    e.stopPropagation()

    if (!isDeleting) {
      onToggleSelect()
    }
  }

  const dateString = new Date(createdAt).toLocaleDateString(LOCALE_LANGUAGE_TAGS[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (isEditing) {
    return <CensorshipEditForm censorship={censorship} onEditCompleted={() => setIsEditing(false)} />
  }

  const levelMeta = CENSORSHIP_LEVELS.find((item) => item.level === level)!

  return (
    <div
      aria-selected={isSelected}
      className={twMerge(
        'relative transition aria-selected:bg-brand/10',
        isDeleting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-zinc-800/45',
      )}
      onClick={isDeleting ? undefined : onToggleSelect}
    >
      {/* Deleting overlay with spinner */}
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/50">
          <div className="size-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
        </div>
      )}

      <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5">
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <input
            aria-label={t('card.selectAriaLabel', { value })}
            checked={isSelected}
            className="size-5 appearance-none rounded-md border border-zinc-600 transition cursor-pointer checked:border-brand checked:bg-brand disabled:cursor-not-allowed"
            disabled={isDeleting}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            type="checkbox"
          />
          {isSelected && <Check className="pointer-events-none absolute size-3 text-background" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 truncate text-sm font-semibold text-zinc-100 sm:text-base">{value}</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {t(CENSORSHIP_KEY_MESSAGE_PATHS[key])}
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">{t('card.addedAt', { date: dateString })}</div>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${getLevelBadgeClassName(level)}`}>
          {t(levelMeta.messagePath)}
        </span>
        <button
          aria-label={t('card.editAriaLabel')}
          className={`ml-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition ${
            isDeleting ? 'cursor-not-allowed opacity-50' : 'hover:bg-zinc-700 hover:text-zinc-100'
          }`}
          disabled={isDeleting}
          onClick={handleEdit}
          type="button"
        >
          <SquarePen className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function CensorshipCardSkeleton() {
  return (
    <div className="animate-fade-in px-4 py-3 sm:px-5">
      <div className="flex min-h-16 items-center gap-3">
        <div className="size-5 rounded-md border border-zinc-700 bg-zinc-800" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 rounded bg-zinc-800" />
            <div className="h-5 w-14 rounded-md bg-zinc-800" />
          </div>
          <div className="mt-2 h-3 w-28 rounded bg-zinc-800" />
        </div>
        <div className="h-6 w-14 rounded-md bg-zinc-800" />
        <div className="size-9 rounded-lg bg-zinc-800" />
      </div>
    </div>
  )
}

function getLevelBadgeClassName(level: CensorshipLevel) {
  switch (level) {
    case CensorshipLevel.HEAVY:
      return 'border border-red-500/15 bg-red-500/10 text-red-300'
    case CensorshipLevel.LIGHT:
      return 'border border-yellow-500/15 bg-yellow-500/10 text-yellow-300'
    case CensorshipLevel.NONE:
      return 'border border-green-500/15 bg-green-500/10 text-green-300'
  }

  return 'border border-zinc-700 bg-zinc-800 text-zinc-300'
}
