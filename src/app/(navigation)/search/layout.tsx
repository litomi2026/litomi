import { Suspense } from 'react'

import ViewToggle from '@/components/ViewToggle'

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
        className="fixed top-0 z-20 w-full p-2 pt-[max(0.5rem,var(--safe-area-top))] pr-[max(0.5rem,calc(var(--safe-area-right)))] bg-background border-b-2 shadow-sm 
          sm:max-w-[calc(100vw-5rem-var(--safe-area-left))] 2xl:max-w-7xl"
      >
        <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm md:justify-end md:text-base">
          <SearchForm className="grow w-full md:w-auto" />
          <KeywordSubscriptionButton />
          <ViewToggle />
          <FilterButton />
        </div>
      </header>
      <div className="h-[110px] md:h-[62px]" />
      <div className="flex flex-col gap-2 p-2 grow">{children}</div>
    </main>
  )
}
