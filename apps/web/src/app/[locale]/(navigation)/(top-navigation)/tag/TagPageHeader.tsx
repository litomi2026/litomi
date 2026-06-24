import type { PublicLocale } from '@litomi/domain/locale'
import { BookOpen, Tag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ComponentProps } from 'react'

import { Link } from '@/i18n/navigation'

type Props = {
  activeView: TagView
  locale: PublicLocale
  tagsHref?: ComponentProps<typeof Link>['href']
}

type TagView = 'dictionary' | 'tags'

export default async function TagPageHeader({ activeView, locale, tagsHref = '/tag/female' }: Props) {
  const t = await getTranslations({ locale, namespace: 'Tag' })

  const viewLinkClassName =
    'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 aria-current:bg-foreground aria-current:text-background'

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-1 md:flex-row md:items-end md:justify-between">
      <div className="grid max-w-2xl gap-2">
        <h1 className="text-3xl font-bold leading-tight tracking-normal text-foreground md:text-4xl">{t('title')}</h1>
        <p className="max-w-xl text-sm leading-6 text-zinc-400 md:text-base">{t('description')}</p>
      </div>
      <nav
        aria-label={t('views.label')}
        className="grid grid-cols-2 overflow-hidden rounded-lg p-1 border border-zinc-800/80 bg-zinc-950/70 md:w-fit"
      >
        <Link aria-current={activeView === 'tags' ? 'page' : undefined} className={viewLinkClassName} href={tagsHref}>
          <Tag aria-hidden className="size-4" />
          {t('views.tags')}
        </Link>
        <Link
          aria-current={activeView === 'dictionary' ? 'page' : undefined}
          className={viewLinkClassName}
          href="/tag/dictionary"
        >
          <BookOpen aria-hidden className="size-4" />
          {t('views.dictionary')}
        </Link>
      </nav>
    </header>
  )
}
