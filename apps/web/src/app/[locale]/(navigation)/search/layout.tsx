import { getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import ViewToggle from '@/components/ViewToggle'

import FilterButton from './FilterButton'
import KeywordSubscriptionButton from './KeywordSubscriptionButton'
import SearchForm from './SearchForm'

export default async function Layout({ children }: LayoutProps<'/[locale]/search'>) {
  const t = await getTranslations('Search')

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{t('title')}</h1>
      <AutoHideHeader
        className={twMerge(
          'fixed top-0 z-20 w-full pt-safe px-safe border-b border-zinc-800 bg-background/95 shadow transition',
          'sm:max-w-[calc(100vw-5rem-var(--safe-area-left))] sm:pl-0 2xl:max-w-7xl sm:border-b-2',
          'sm:data-[auto-hide=true]:opacity-100',
        )}
      >
        <div className="flex items-center justify-center flex-wrap gap-2 whitespace-nowrap p-2 md:justify-end">
          <SearchForm className="grow w-full min-w-0 md:w-auto" />
          <KeywordSubscriptionButton />
          <ViewToggle />
          <FilterButton />
        </div>
      </AutoHideHeader>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </main>
  )
}
