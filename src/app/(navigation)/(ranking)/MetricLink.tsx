'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { DEFAULT_PERIOD, metricInfo, MetricParam, Params } from './common'

type Props = {
  value: MetricParam
}

export default function MetricLink({ value }: Props) {
  const { metric, period } = useParams<Params>()
  const info = metricInfo[value]

  return (
    <Link
      aria-current={metric === value}
      className="flex items-center gap-2 p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-foreground hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-foreground aria-current:pointer-events-none"
      href={`/ranking/${value}/${period || DEFAULT_PERIOD}`}
      prefetch={false}
    >
      <LinkPending className="size-4 text-foreground">
        <info.icon className="size-4" />
      </LinkPending>
      {info.label}
    </Link>
  )
}
