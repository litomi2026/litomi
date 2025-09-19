import Link from 'next/link'

import type { LayoutProps } from '@/types/nextjs'

import LinkPending from '@/components/LinkPending'

import { metricInfo, MetricParam, periodLabels } from './common'
import MetricLink from './MetricLink'
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
          {Object.entries(periodLabels).map(([value, label]) => (
            <Link
              className="p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-900"
              href={value}
              key={value}
            >
              <LinkPending className="text-foreground w-6 h-5">{label}</LinkPending>
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </main>
  )
}
