import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'
import { getViewFromSearchParams } from '@/utils/param'

import SearchPage from './SearchPage'

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

  return <SearchPage filters={filters} hasActiveFilters={Boolean(Object.values(filters).some(Boolean))} view={view} />
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}
