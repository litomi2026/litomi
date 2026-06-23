'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import { Link, usePathname } from '@/i18n/navigation'

import { getPrimaryRankingIconClassName, PRIMARY_RANKING_NAV_LINK_CLASSNAME } from './common'

export default function DonationLink() {
  const pathname = usePathname()
  const t = useTranslations('RankingPage')
  const isDonationPage = pathname.startsWith('/ranking/donation')

  return (
    <Link
      aria-current={isDonationPage ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href="/ranking/donation"
    >
      <LinkPending className="size-4">
        <Heart className={getPrimaryRankingIconClassName(isDonationPage, 'fill')} />
      </LinkPending>
      {t('donation')}
    </Link>
  )
}
