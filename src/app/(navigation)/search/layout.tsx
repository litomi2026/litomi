import { Suspense } from 'react'

import type { LayoutProps } from '@/types/nextjs'

import ViewToggle from '@/components/ViewSlider'

import FilterButton from './FilterButton'
import KeywordSubscriptionButton from './KeywordSubscriptionButton'
import ScrollReset from './ScrollReset'
import SearchForm from './SearchForm'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col grow">
      <Suspense>
        <ScrollReset />
      </Suspense>
      <h1 className="sr-only">만화 검색</h1>
      <div className="fixed top-0 left-0 right-0 z-10 p-2 bg-background border-b-2 border-zinc-800 shadow-sm max-w-screen-2xl mx-auto sm:left-20 2xl:max-w-screen-xl 2xl:left-64">
        <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm md:justify-end md:text-base">
          <Suspense>
            <SearchForm className="grow w-full md:w-auto" />
          </Suspense>
          <Suspense>
            <KeywordSubscriptionButton />
          </Suspense>
          <ViewToggle />
          <Suspense>
            <FilterButton />
          </Suspense>
        </div>
      </div>
      <div className="h-[110px] md:h-[62px]" />
      <div className="flex flex-col p-2 grow">{children}</div>
    </main>
  )
}
