'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { View } from '@/utils/param'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import SearchResult, { SearchResultLoading } from './SearchResults'
import TrendingKeywords from './TrendingKeywords'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const viewFromQuery = searchParams.get('view')
  const view = viewFromQuery === View.IMAGE ? View.IMAGE : View.CARD

  const filters = {
    sort: searchParams.get('sort'),
    minView: searchParams.get('min-view'),
    maxView: searchParams.get('max-view'),
    minPage: searchParams.get('min-page'),
    maxPage: searchParams.get('max-page'),
    minRating: searchParams.get('min-rating'),
    maxRating: searchParams.get('max-rating'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    nextId: searchParams.get('next-id'),
    skip: searchParams.get('skip'),
  }

  const hasActiveFilters = Boolean(Object.values(filters).some(Boolean))

  return (
    <>
      {hasActiveFilters ? (
        <div className="gap-2 pb-2 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">적용된 필터</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={filters} />
        </div>
      ) : (
        <TrendingKeywords />
      )}
      <Suspense fallback={<SearchResultLoading view={view} />}>
        <SearchResult />
      </Suspense>
    </>
  )
}
