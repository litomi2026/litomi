'use client'

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'
import { Link } from '@/i18n/navigation'

import {
  DEFAULT_PERIOD,
  getPrimaryRankingIconClassName,
  isPeriodParam,
  metricInfo,
  MetricParam,
  Params,
  PRIMARY_RANKING_NAV_LINK_CLASSNAME,
} from './common'

type Props = {
  value: MetricParam
}

export default function MetricLink({ value }: Props) {
  const { metric, period } = useParams<Params>()
  const t = useTranslations('RankingPage')

  const isSelected = metric === value
  const info = metricInfo[value]
  const targetPeriod = isPeriodParam(period) ? period : DEFAULT_PERIOD

  return (
    <Link
      aria-current={isSelected ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href={`/ranking/${value}/${targetPeriod}`}
      prefetch={false}
    >
      <LinkPending className="size-4">
        <info.icon className={getPrimaryRankingIconClassName(isSelected, info.selectedIconStyle)} />
      </LinkPending>
      {t(`metrics.${value}`)}
    </Link>
  )
}
