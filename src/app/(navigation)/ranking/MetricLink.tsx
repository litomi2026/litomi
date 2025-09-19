'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { DEFAULT_PERIOD, metricInfo, MetricParam, Params } from './common'

type Props = {
  value: MetricParam
}

export default function MetricLink({ value }: Props) {
  const { metric: currentMetric } = useParams<Params>()
  const metric = metricInfo[value]

  return (
    <Link
      aria-current={currentMetric === value}
      className="flex items-center gap-2 p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-white aria-current:pointer-events-none"
      href={`../${value}/${DEFAULT_PERIOD}`}
      key={value}
    >
      <LinkPending className="size-4 text-foreground">
        <metric.icon className="size-4" />
      </LinkPending>
      {metric.label}
    </Link>
  )
}
