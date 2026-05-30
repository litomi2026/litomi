'use client'

import { Heart } from 'lucide-react'

import LinkPending from '@/components/LinkPending'
import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'

import { getPrimaryRankingIconClassName, PRIMARY_RANKING_NAV_LINK_CLASSNAME } from './common'

export default function DonationLink() {
  const pathname = usePathname()
  const isDonationPage = pathname.startsWith('/ranking/donation')

  return (
    <Link
      aria-current={isDonationPage ? 'page' : undefined}
      className={PRIMARY_RANKING_NAV_LINK_CLASSNAME}
      href="/ranking/donation"
      prefetch={false}
    >
      <LinkPending className="size-4">
        <Heart className={getPrimaryRankingIconClassName(isDonationPage, 'fill')} />
      </LinkPending>
      후원
    </Link>
  )
}
