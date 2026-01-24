import AutoHideNavigation from '../AutoHideNavigation'
import { metricInfo, MetricParam } from './common'
import DonationLink from './DonationLink'
import MetricLink from './MetricLink'
import PeriodNavigation from './PeriodNavigation'
import RankingTitle from './RankingTitle'
import RealtimeLink from './RealtimeLink'

export default async function Layout({ children }: LayoutProps<'/'>) {
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
        <nav className="flex gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap overscroll-none">
          {Object.keys(metricInfo).map((value) => (
            <MetricLink key={value} value={value as MetricParam} />
          ))}
          <DonationLink />
          <RealtimeLink />
        </nav>
        <PeriodNavigation />
      </header>
      {children}
    </main>
  )
}
