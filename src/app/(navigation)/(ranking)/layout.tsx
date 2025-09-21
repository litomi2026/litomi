import type { LayoutProps } from '@/types/nextjs'

import AutoHideNavigation from '../AutoHideNavigation'
import { metricInfo, MetricParam, periodLabels, PeriodParam } from './common'
import MetricLink from './MetricLink'
import PeriodLink from './PeriodLink'
import RankingTitle from './RankingTitle'
import RealtimeLink from './RealtimeLink'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col grow">
      <RankingTitle />
      <p className="p-1 px-4 text-xs text-zinc-500">
        인기 순위는 이용자가 많아져야 더 정확해져요. 주변에 많이 알려주세요.
      </p>
      <header
        className="sticky top-0 z-20 grid gap-1 bg-background/90 backdrop-blur border-b p-2 transition aria-busy:opacity-50"
        data-navigation-header
      >
        <AutoHideNavigation selector="[data-navigation-header]" />
        <nav className="flex gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap">
          {Object.keys(metricInfo).map((value) => (
            <MetricLink key={value} value={value as MetricParam} />
          ))}
          <RealtimeLink />
        </nav>
        <nav className="flex gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap">
          {Object.keys(periodLabels).map((value) => (
            <PeriodLink key={value} value={value as PeriodParam} />
          ))}
        </nav>
      </header>
      {children}
    </main>
  )
}
