'use client'

import { TrendingUp } from 'lucide-react'
import { useParams } from 'next/navigation'

import { metricInfo, Params, periodLabels } from './common'

export default function RankingTitle() {
  const { metric, period } = useParams<Params>()
  const currentMetric = metricInfo[metric]

  return (
    <div className="flex items-center gap-3 p-4 pb-2">
      {currentMetric && <currentMetric.icon className="size-5 text-foreground" />}
      <h1 className="text-xl font-bold">
        {periodLabels[period]} {currentMetric?.label} 순위
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <TrendingUp className="size-4 text-zinc-500" />
        <span className="text-sm text-zinc-500">TOP 20</span>
      </div>
    </div>
  )
}
