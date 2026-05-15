'use client'

import { Rabbit } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function NewMangaLink() {
  const pathname = usePathname()
  const isNewPage = pathname.startsWith('/new')

  return (
    <Link
      aria-current={isNewPage}
      className={`${topNavigationActionClassName} aria-current:bg-brand aria-current:text-background aria-current:font-semibold aria-current:pointer-events-none`}
      href={`/new/1`}
      prefetch={false}
    >
      <LinkPending className="size-5">
        <Rabbit className="size-5" />
      </LinkPending>{' '}
      <span className="hidden sm:inline">신작</span>
    </Link>
  )
}
