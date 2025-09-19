'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { Params, periodLabels, PeriodParam } from './common'

export default function PeriodLink({ value }: { value: PeriodParam }) {
  const { period: currentPeriod } = useParams<Params>()
  const label = periodLabels[value]

  return (
    <Link
      aria-current={currentPeriod === value}
      className="p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-white aria-current:pointer-events-none"
      href={value}
      key={value}
    >
      <LinkPending className="text-foreground w-6 h-5">{label}</LinkPending>
    </Link>
  )
}
