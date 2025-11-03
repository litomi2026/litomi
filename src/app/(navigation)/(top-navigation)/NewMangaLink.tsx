'use client'

import { Rabbit } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

export default function NewMangaLink() {
  const pathname = usePathname()
  const isNewPage = pathname.startsWith('/new')

  return (
    <Link
      aria-current={isNewPage}
      className="flex items-center gap-2 p-2 px-3 rounded-xl transition border-2 text-foreground hover:bg-zinc-900
      aria-current:bg-brand aria-current:text-background aria-current:font-semibold aria-current:pointer-events-none"
      href={`/new/1`}
    >
      <LinkPending className="size-5">
        <Rabbit className="size-5" />
      </LinkPending>{' '}
      신작
    </Link>
  )
}
