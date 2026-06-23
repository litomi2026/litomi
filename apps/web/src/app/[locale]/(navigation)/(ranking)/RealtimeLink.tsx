'use client'

import { Activity } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import { Link, usePathname } from '@/i18n/navigation'

import { getPrimaryRankingIconClassName, PRIMARY_RANKING_NAV_LINK_CLASSNAME } from './common'

export default function RealtimeLink() {
  const pathname = usePathname()
  const isRealtimePage = pathname === '/realtime'
  const t = useTranslations('RankingPage')

  return (
    <Link
      aria-current={isRealtimePage ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href="/realtime"
    >
      <LinkPending className="size-4">
        <Activity className={getPrimaryRankingIconClassName(isRealtimePage, 'stroke-bold')} />
      </LinkPending>
      {t('realtime')}
    </Link>
  )
}
