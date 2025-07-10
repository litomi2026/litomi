import { Suspense } from 'react'

import type { BaseLayoutProps } from '@/types/nextjs'

import ViewToggle from '@/components/ViewSlider'

import FilterButton from './FilterButton'
import ScrollReset from './ScrollReset'
import SearchForm from './SearchForm'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <main className="flex flex-col grow">
      <Suspense>
        <ScrollReset />
      </Suspense>
      <h1 className="sr-only">만화 검색</h1>
      <div className="sticky top-0 z-10 bg-background border-b-2 border-zinc-800 shadow-sm">
        <div className="px-2 py-2">
          <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
            <Suspense>
              <SearchForm className="grow" />
            </Suspense>
            <ViewToggle />
            <Suspense>
              <FilterButton />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-2 grow">{children}</div>
    </main>
  )
}
