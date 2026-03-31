import { Suspense } from 'react'

import ViewToggle from '@/components/ViewToggle'

import AutoHideNavigation from '../AutoHideNavigation'
import FilterButton from './FilterButton'
import KeywordSubscriptionButton from './KeywordSubscriptionButton'
import ScrollReset from './ScrollReset'
import SearchForm from './SearchForm'

export default async function Layout({ children }: LayoutProps<'/search'>) {
  return (
    <main className="flex flex-col grow">
      <Suspense>
        <ScrollReset />
      </Suspense>
      <h1 className="sr-only">작품 검색</h1>
      <header
        className="fixed top-0 z-20 w-full pt-safe px-safe border-b-2 border-zinc-800 bg-background/95 shadow-md
          sm:max-w-[calc(100vw-5rem-var(--safe-area-left))] sm:pl-0 2xl:max-w-7xl max-sm:aria-busy:opacity-50 transition"
        data-search-header
      >
        <AutoHideNavigation selector="[data-search-header]" />
        <div className="flex items-center justify-center flex-wrap gap-2 whitespace-nowrap p-2 md:justify-end">
          <SearchForm className="grow w-full min-w-0 md:w-auto" />
          <KeywordSubscriptionButton />
          <ViewToggle />
          <FilterButton />
        </div>
      </header>
      <div className="h-[100px] md:h-[56px]" />
      <div className="flex flex-col gap-2 p-2 grow">{children}</div>
    </main>
  )
}
