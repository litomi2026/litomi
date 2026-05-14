'use client'

import { TOP_MANGA_PER_PAGE } from '@litomi/domain/constants/policy'
import { TrendingUp } from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'

import { metricInfo, Params, periodLabels } from './common'

export default function RankingTitle() {
  const { metric, period } = useParams<Params>()
  const pathname = usePathname()
  const currentMetric = metricInfo[metric]

  function renderTitle() {
    if (pathname.startsWith('/ranking/donation')) {
      return '후원 랭킹'
    }
    if (pathname === '/realtime') {
      return '실시간 인기'
    }
    return `${periodLabels[period] || '실시간'} ${currentMetric?.label ?? ''} 순위`.trim()
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
