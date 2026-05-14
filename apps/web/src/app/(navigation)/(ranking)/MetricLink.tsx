'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import {
  DEFAULT_PERIOD,
  getPrimaryRankingIconClassName,
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
  const isSelected = metric === value
  const info = metricInfo[value]

  return (
    <Link
      aria-current={isSelected ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href={`/ranking/${value}/${period || DEFAULT_PERIOD}`}
      prefetch={false}
    >
      <LinkPending className="size-4">
        <info.icon className={getPrimaryRankingIconClassName(isSelected, info.selectedIconStyle)} />
      </LinkPending>
      {info.label}
    </Link>
  )
}
