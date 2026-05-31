'use client'

import { TOP_MANGA_PER_PAGE } from '@litomi/domain/ranking/policy'
import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import { usePathname } from '@/i18n/navigation'

import { DEFAULT_METRIC, DEFAULT_PERIOD, Params } from './common'

export default function RankingTitle() {
  const { metric, period } = useParams<Params>()
  const pathname = usePathname()
  const t = useTranslations('RankingPage')

  function renderTitle() {
    if (pathname.startsWith('/ranking/donation')) {
      return t('donationTitle')
    }
    if (pathname === '/realtime') {
      return t('realtimeTitle')
    }
    return t('title', {
      metric: t(`metrics.${metric || DEFAULT_METRIC}`),
      period: t(`periods.${period || DEFAULT_PERIOD}`),
    })
  }

  return (
    <div className="flex items-center flex-wrap gap-3 p-4 pb-2">
      <h1 className="text-xl font-bold">{renderTitle()}</h1>
      <div className="ml-auto flex items-center gap-2">
        <TrendingUp className="size-4 text-zinc-500" />
        <span className="text-xs text-zinc-500">TOP {TOP_MANGA_PER_PAGE}</span>
      </div>
    </div>
  )
}
