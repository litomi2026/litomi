'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { CensorshipLevel } from '@litomi/domain/censorship/model'
import { Locale } from '@litomi/domain/locale'
import { Eye, EyeOff } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import useMangaCensorship from '@/hook/useMangaCensorship'
import { Link } from '@/i18n/navigation'
import useMeQuery from '@/query/useMeQuery'

import type { ChildrenDayLocale } from './MangaCardCensorshipChildren'

const MangaCardCensorshipChildren = dynamic(() => import('./MangaCardCensorshipChildren'))

const CHILDREN_TAGS = new Set(['kodomo_doushi', 'kodomo_only', 'loli', 'lolicon', 'shota', 'shotacon', 'toddlercon'])

type ChildrenDay = {
  month: number
  day: number
  locale: ChildrenDayLocale
}

const CHILDREN_DAY_BY_LOCALE = {
  [Locale.EN]: { month: 11, day: 20, locale: 'en' },
  [Locale.JA]: { month: 5, day: 5, locale: 'ja' },
  [Locale.KO]: { month: 5, day: 5, locale: 'ko' },
  [Locale.ZH_CN]: { month: 6, day: 1, locale: 'zh-CN' },
  [Locale.ZH_TW]: { month: 4, day: 4, locale: 'zh-TW' },
} satisfies Record<Locale, ChildrenDay>

type Props = {
  manga: Manga
}

export default function MangaCardCensorship({ manga }: Props) {
  const [isBlurDisabled, setIsBlurDisabled] = useState(false)
  const t = useTranslations('Common.mangaCard.censorship')
  const { getMatch } = useMangaCensorship()
  const { data: me } = useMeQuery()
  const locale = useLocale()

  const myName = me?.name ?? ''
  const childrenDay = getChildrenDayForLocale(locale)
  const isChildrenDay = checkChildrenDay(childrenDay)
  const { censoringReasons, highestCensorshipLevel } = getMatch(manga)
  const shouldCensorChildren = isChildrenDay && manga.tags?.some((tag) => CHILDREN_TAGS.has(tag.value))

  if (highestCensorshipLevel === CensorshipLevel.HEAVY) {
    return null
  }

  if (shouldCensorChildren) {
    return <MangaCardCensorshipChildren locale={childrenDay.locale} />
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
        title={isBlurDisabled ? t('apply') : t('temporaryDisable')}
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
        {t('workCensored', { reasons: censoringReasons.join(', ') })}
      </Link>
    </div>
  )
}

function checkChildrenDay(childrenDay: ChildrenDay) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  return currentMonth === childrenDay.month && currentDay === childrenDay.day
}

function getChildrenDayForLocale(locale: string) {
  switch (locale) {
    case Locale.EN:
      return CHILDREN_DAY_BY_LOCALE[Locale.EN]
    case Locale.JA:
      return CHILDREN_DAY_BY_LOCALE[Locale.JA]
    case Locale.KO:
      return CHILDREN_DAY_BY_LOCALE[Locale.KO]
    case Locale.ZH_CN:
      return CHILDREN_DAY_BY_LOCALE[Locale.ZH_CN]
    case Locale.ZH_TW:
      return CHILDREN_DAY_BY_LOCALE[Locale.ZH_TW]
    default:
      return CHILDREN_DAY_BY_LOCALE[Locale.KO]
  }
}
