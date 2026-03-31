import { Metadata } from 'next'
import { Suspense } from 'react'

import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import { generateOpenGraphMetadata } from '@/constants'
import { getViewFromSearchParams } from '@/utils/param'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import SearchResult, { SearchResultLoading } from './SearchResults'
import TrendingKeywords from './TrendingKeywords'

export const metadata: Metadata = {
  title: '검색',
  ...generateOpenGraphMetadata({
    title: '검색',
    url: '/search',
  }),
  alternates: {
    canonical: '/search',
    languages: { ko: '/search' },
  },
}

export default async function Page({ searchParams }: PageProps<'/search'>) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const normalizedValue = getSearchParamValue(value)

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
  }

  const filters = {
    sort: params.get('sort'),
    minView: params.get('min-view'),
    maxView: params.get('max-view'),
    minPage: params.get('min-page'),
    maxPage: params.get('max-page'),
    minRating: params.get('min-rating'),
    maxRating: params.get('max-rating'),
    from: params.get('from'),
    to: params.get('to'),
    nextId: params.get('next-id'),
    skip: params.get('skip'),
  }

  const view = getViewFromSearchParams(params)
  const hasActiveFilters = Boolean(Object.values(filters).some(Boolean))

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

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}
