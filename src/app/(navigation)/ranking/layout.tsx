import type { LayoutProps } from '@/types/nextjs'

import { metricInfo, MetricParam, periodLabels, PeriodParam } from './common'
import MetricLink from './MetricLink'
import PeriodLink from './PeriodLink'
import RankingTitle from './RankingTitle'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col grow">
      <RankingTitle />
      <header className="sticky top-0 z-20 grid gap-1 bg-background/90 backdrop-blur border-b p-2 whitespace-nowrap">
        <nav className="flex gap-1 overflow-x-auto">
          {Object.keys(metricInfo).map((value) => (
            <MetricLink key={value} value={value as MetricParam} />
          ))}
        </nav>
        <nav className="flex gap-1 overflow-x-auto">
          {Object.keys(periodLabels).map((value) => (
            <PeriodLink key={value} value={value as PeriodParam} />
          ))}
        </nav>
      </header>
      {children}
    </main>
  )
}
