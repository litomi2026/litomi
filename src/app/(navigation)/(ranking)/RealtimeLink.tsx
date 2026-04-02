'use client'

import { Activity } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { getPrimaryRankingIconClassName, PRIMARY_RANKING_NAV_LINK_CLASSNAME } from './common'

export default function RealtimeLink() {
  const pathname = usePathname()
  const isRealtimePage = pathname === '/realtime'

  return (
    <Link
      aria-current={isRealtimePage ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href="/realtime"
      prefetch={false}
    >
      <LinkPending className="size-4">
        <Activity className={getPrimaryRankingIconClassName(isRealtimePage, 'stroke-bold')} />
      </LinkPending>
      실시간
    </Link>
  )
}
