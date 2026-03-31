import { Suspense } from 'react'

import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import { View } from '@/utils/param'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import SearchResult, { SearchResultLoading } from './SearchResults'
import TrendingKeywords from './TrendingKeywords'

type Filters = {
  sort: string | null
  minView: string | null
  maxView: string | null
  minPage: string | null
  maxPage: string | null
  minRating: string | null
  maxRating: string | null
  from: string | null
  to: string | null
  nextId: string | null
  skip: string | null
}

type Props = {
  filters: Filters
  hasActiveFilters: boolean
  view: View
}

export default function SearchPage({ filters, hasActiveFilters, view }: Readonly<Props>) {
  return (
    <>
      {hasActiveFilters ? (
        <div className="gap-2 pb-2 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">적용된 조건</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={filters} />
        </div>
      ) : (
        <TrendingKeywords view={view} />
      )}
      <NonAdultJuicyAdsBanner />
      <Suspense fallback={<SearchResultLoading view={view} />}>
        <SearchResult />
      </Suspense>
    </>
  )
}
