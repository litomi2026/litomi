'use client'

import { Compass } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function RecommendMangaLink() {
  const pathname = usePathname()
  const t = useTranslations('TopNavigation.actions')
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
      <span className="hidden sm:inline">{t('recommend')}</span>
    </Link>
  )
}
