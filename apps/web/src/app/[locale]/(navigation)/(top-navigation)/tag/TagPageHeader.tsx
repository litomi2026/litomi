import type { PublicLocale } from '@litomi/domain/locale'
import type { ComponentProps } from 'react'

import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

type Props = {
  activeView: TagView
  locale: PublicLocale
  tagsHref?: ComponentProps<typeof Link>['href']
}

type TagView = 'dictionary' | 'tags'

export default async function TagPageHeader({ activeView, locale, tagsHref = '/tag/female' }: Props) {
  const t = await getTranslations({ locale, namespace: 'Tag' })

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-1 sr-only">
        <h1 className="text-2xl font-semibold text-zinc-100">{t('title')}</h1>
        <p className="text-sm leading-6 text-zinc-400">{t('description')}</p>
      </div>
      <nav
        aria-label={t('views.label')}
        className="grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60 p-1 sm:flex sm:w-fit"
      >
        <Link
          aria-current={activeView === 'tags' ? 'page' : undefined}
          className="rounded-md px-4 py-2 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100 aria-current:bg-zinc-800 aria-current:text-zinc-100"
          href={tagsHref}
        >
          {t('views.tags')}
        </Link>
        <Link
          aria-current={activeView === 'dictionary' ? 'page' : undefined}
          className="rounded-md px-4 py-2 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100 aria-current:bg-zinc-800 aria-current:text-zinc-100"
          href="/tag/dictionary"
        >
          {t('views.dictionary')}
        </Link>
      </nav>
    </header>
  )
}
