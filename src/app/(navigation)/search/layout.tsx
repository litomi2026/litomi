import ViewToggle from '@/components/ViewToggle'

import AutoHideNavigation from '../AutoHideNavigation'
import FilterButton from './FilterButton'
import KeywordSubscriptionButton from './KeywordSubscriptionButton'
import SearchForm from './SearchForm'

export default async function Layout({ children }: LayoutProps<'/search'>) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">작품 검색</h1>
      <header
        className="fixed top-0 z-20 w-full pt-safe px-safe border-b border-zinc-800 bg-background/95 shadow transition
          sm:max-w-[calc(100vw-5rem-var(--safe-area-left))] sm:pl-0 2xl:max-w-7xl max-sm:aria-busy:opacity-50 sm:border-b-2"
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
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2">{children}</div>
    </main>
  )
}
