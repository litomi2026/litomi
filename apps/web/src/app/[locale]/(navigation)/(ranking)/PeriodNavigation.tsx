'use client'

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'
import { Link } from '@/i18n/navigation'

import {
  DEFAULT_METRIC,
  DEFAULT_PERIOD,
  Params,
  PeriodParam,
  periodParams,
  SECONDARY_RANKING_NAV_LINK_CLASSNAME,
} from './common'

export default function PeriodNavigation() {
  const { metric, period } = useParams<Params>()
  const t = useTranslations('RankingPage')
  const show = Boolean(metric && period)

  if (!show) {
    return null
  }

  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-hidden whitespace-nowrap overscroll-none">
      {periodParams.map((periodValue: PeriodParam) => (
        <Link
          aria-current={period === periodValue ? 'page' : undefined}
          className={SECONDARY_RANKING_NAV_LINK_CLASSNAME}
          href={`/ranking/${metric || DEFAULT_METRIC}/${periodValue || DEFAULT_PERIOD}`}
          key={periodValue}
          prefetch={false}
        >
          <LinkPending className="h-5 w-6">{t(`periods.${periodValue}`)}</LinkPending>
        </Link>
      ))}
    </nav>
  )
}
