'use client'

import { Rabbit } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import { Link, usePathname } from '@/i18n/navigation'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function NewMangaLink() {
  const pathname = usePathname()
  const t = useTranslations('TopNavigation.actions')
  const isNewPage = pathname.startsWith('/new')

  return (
    <Link
      aria-current={isNewPage}
      className={`${topNavigationActionClassName} aria-current:bg-brand aria-current:text-background aria-current:font-semibold aria-current:pointer-events-none`}
      href="/new"
    >
      <LinkPending className="size-5">
        <Rabbit className="size-5" />
      </LinkPending>{' '}
      <span className="hidden sm:inline">{t('new')}</span>
    </Link>
  )
}
