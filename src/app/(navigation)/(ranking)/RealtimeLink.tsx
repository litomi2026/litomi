'use client'

import { Activity } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

export default function RealtimeLink() {
  const pathname = usePathname()
  const isRealtimePage = pathname === '/realtime'

  return (
    <Link
      aria-current={isRealtimePage}
      className="flex items-center gap-2 p-2 px-4 rounded-lg text-sm font-medium transition text-zinc-400 hover:text-foreground hover:bg-zinc-900
      aria-current:bg-zinc-900 aria-current:text-foreground aria-current:pointer-events-none"
      href="/realtime"
      prefetch={false}
    >
      <LinkPending className="size-4 text-foreground">
        <Activity className="size-4" />
      </LinkPending>
      실시간
    </Link>
  )
}
