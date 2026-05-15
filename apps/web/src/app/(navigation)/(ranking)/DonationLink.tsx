'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

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
