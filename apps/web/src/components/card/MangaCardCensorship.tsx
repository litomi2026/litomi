'use client'

import type { Manga } from '@litomi/domain/types/manga'

import { CensorshipLevel } from '@litomi/domain/database/enum'
import { Eye, EyeOff } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

import useMangaCensorship from '@/hook/useMangaCensorship'
import useMeQuery from '@/query/useMeQuery'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'

const MangaCardCensorshipChildren = dynamic(() => import('./MangaCardCensorshipChildren'))

const CHILDREN_TAGS = new Set(['kodomo_doushi', 'kodomo_only', 'loli', 'lolicon', 'shota', 'shotacon', 'toddlercon'])

type Props = {
  manga: Manga
}

export default function MangaCardCensorship({ manga }: Props) {
  const { data: me } = useMeQuery()
  const { getMatch } = useMangaCensorship()
  const [isBlurDisabled, setIsBlurDisabled] = useState(false)

  const locale = getLocaleFromCookie() || navigator.language || 'ko'
  const childrenDay = getChildrenDayForLocale(locale)
  const isChildrenDay = checkChildrenDay(childrenDay)
  const shouldCensorChildren = isChildrenDay && manga.tags?.some((tag) => CHILDREN_TAGS.has(tag.value))
  const { censoringReasons, highestCensorshipLevel } = getMatch(manga)
  const myName = me?.name ?? ''

  if (highestCensorshipLevel === CensorshipLevel.HEAVY) {
    return null
  }

  if (shouldCensorChildren) {
    return <MangaCardCensorshipChildren locale={childrenDay?.locale} />
  }

  if (!censoringReasons || censoringReasons.length === 0) {
    return null
  }

  return (
    <div
      aria-current={!isBlurDisabled}
      className="absolute inset-0 flex items-center justify-center text-center p-4 pointer-events-none transition aria-current:bg-background/80 aria-current:backdrop-blur"
    >
      <button
        className="absolute top-2 right-2 p-2.5 rounded-full bg-background/90 hover:bg-background border border-zinc-700 pointer-events-auto transition"
        onClick={() => setIsBlurDisabled(!isBlurDisabled)}
        title={isBlurDisabled ? '검열 적용' : '검열 임시 해제'}
        type="button"
      >
        {isBlurDisabled ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </button>
      <Link
        aria-hidden={isBlurDisabled}
        className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center pointer-events-auto transition hover:underline aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        href={`/@${myName}/censor`}
        prefetch={false}
      >
        {censoringReasons.join(', ')} 작품 검열
      </Link>
    </div>
  )
}

function checkChildrenDay(childrenDay: { month: number; day: number } | undefined) {
  if (!childrenDay) {
    return false
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  return currentMonth === childrenDay.month && currentDay === childrenDay.day
}

function getChildrenDayForLocale(locale: string) {
  switch (locale) {
    case 'en':
    case 'en-US':
      return { month: 11, day: 20, locale: 'en' }
    case 'ja':
    case 'ja-JP':
      return { month: 5, day: 5, locale: 'ja' }
    case 'ko':
    case 'ko-KR':
      return { month: 5, day: 5, locale: 'ko' }
    case 'zh':
    case 'zh-CN':
      return { month: 6, day: 1, locale: 'zh-CN' }
    case 'zh-TW':
      return { month: 4, day: 4, locale: 'zh-TW' }
  }
}
