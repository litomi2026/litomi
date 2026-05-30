'use client'

import { Compass } from 'lucide-react'

import LinkPending from '@/components/LinkPending'
import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function RecommendMangaLink() {
  const pathname = usePathname()
  const isRecommendPage = pathname.startsWith('/recommend/manga')

  return (
    <Link
      aria-current={isRecommendPage}
      className={`${topNavigationActionClassName} aria-current:bg-brand aria-current:text-background aria-current:font-semibold aria-current:pointer-events-none`}
      href="/recommend/manga"
      prefetch={false}
    >
      <LinkPending className="size-5">
        <Compass className="size-5" />
      </LinkPending>{' '}
      <span className="hidden sm:inline">추천</span>
    </Link>
  )
}
