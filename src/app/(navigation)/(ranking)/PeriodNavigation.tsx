'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { DEFAULT_METRIC, DEFAULT_PERIOD, Params, periodLabels, PeriodParam } from './common'

export default function PeriodNavigation() {
  const { metric, period } = useParams<Params>()
  const show = Boolean(metric && period)

  if (!show) {
    return null
  }

  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap overscroll-none">
      {Object.keys(periodLabels).map((value) => {
        const periodValue = value as PeriodParam
        const label = periodLabels[periodValue]

        return (
          <Link
            aria-current={period === periodValue}
            className="p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-foreground hover:bg-zinc-900
            aria-current:bg-zinc-900 aria-current:text-foreground aria-current:pointer-events-none"
            href={`/ranking/${metric || DEFAULT_METRIC}/${periodValue || DEFAULT_PERIOD}`}
            key={periodValue}
            prefetch={false}
          >
            <LinkPending className="text-foreground w-6 h-5">{label}</LinkPending>
          </Link>
        )
      })}
    </nav>
  )
}
