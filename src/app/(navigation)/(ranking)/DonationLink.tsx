'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

export default function DonationLink() {
  const pathname = usePathname()
  const isDonationPage = pathname.startsWith('/ranking/donation')

  return (
    <Link
      aria-current={isDonationPage}
      className="flex items-center gap-2 p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-foreground hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-foreground aria-current:pointer-events-none"
      href="/ranking/donation"
      prefetch={false}
    >
      <LinkPending className="size-4 text-foreground">
        <Heart className="size-4" />
      </LinkPending>
      기부
    </Link>
  )
}
