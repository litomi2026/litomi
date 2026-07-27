import { getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'

import FilterButton from './FilterButton'
import KeywordSubscriptionButton from './KeywordSubscriptionButton'
import SearchForm from './SearchForm'
import SearchViewToggle from './SearchViewToggle'

export default async function Layout({ children }: LayoutProps<'/[locale]/search'>) {
  const t = await getTranslations('Search')

  return (
    <main className="flex flex-1 flex-col pt-safe">
      <h1 className="sr-only">{t('title')}</h1>
      <AutoHideHeader
        className={twMerge(
          'sticky top-(--safe-area-top) z-30 origin-top transition',
          'max-sm:data-[auto-hide=true]:scale-98 sm:data-[auto-hide=true]:opacity-100',
        )}
      >
        <div className="flex items-center justify-center flex-wrap gap-2 p-2 whitespace-nowrap md:justify-end">
          <SearchForm className="grow w-full min-w-0 md:w-auto" />
          <KeywordSubscriptionButton />
          <SearchViewToggle className="rounded-full [&>div]:rounded-full [&>button]:rounded-full" />
          <FilterButton />
        </div>
      </AutoHideHeader>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  )
}
