'use client'

import { Compass } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import { Link, usePathname } from '@/i18n/navigation'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function RecommendMangaLink() {
  const pathname = usePathname()
  const t = useTranslations('TopNavigation.actions')
  const isRecommendPage = pathname.startsWith('/recommend/manga')

  return (
    <Link
      aria-current={isRecommendPage ? 'page' : undefined}
      className={`${topNavigationActionClassName} aria-[current=page]:bg-brand aria-[current=page]:text-background aria-[current=page]:font-semibold aria-[current=page]:pointer-events-none`}
      href="/recommend/manga"
    >
      <LinkPending className="size-5">
        <Compass className="size-5" />
      </LinkPending>{' '}
      <span className="hidden sm:inline">{t('recommend')}</span>
    </Link>
  )
}
