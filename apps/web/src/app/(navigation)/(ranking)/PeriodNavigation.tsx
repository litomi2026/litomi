'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import {
  DEFAULT_METRIC,
  DEFAULT_PERIOD,
  Params,
  periodLabels,
  PeriodParam,
  SECONDARY_RANKING_NAV_LINK_CLASSNAME,
} from './common'

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
            aria-current={period === periodValue ? 'page' : undefined}
            className={SECONDARY_RANKING_NAV_LINK_CLASSNAME}
            href={`/ranking/${metric || DEFAULT_METRIC}/${periodValue || DEFAULT_PERIOD}`}
            key={periodValue}
            prefetch={false}
          >
            <LinkPending className="h-5 w-6">{label}</LinkPending>
          </Link>
        )
      })}
    </nav>
  )
}
