'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { DEFAULT_METRIC, DEFAULT_PERIOD, Params, periodLabels, PeriodParam } from './common'

export default function PeriodLink({ value }: { value: PeriodParam }) {
  const { metric, period } = useParams<Params>()
  const label = periodLabels[value]

  return (
    <Link
      aria-current={period === value}
      className="p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-foreground hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-foreground aria-current:pointer-events-none"
      href={`/ranking/${metric || DEFAULT_METRIC}/${value || DEFAULT_PERIOD}`}
    >
      <LinkPending className="text-foreground w-6 h-5">{label}</LinkPending>
    </Link>
  )
}
