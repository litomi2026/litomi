import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import { GETProxyKSearchSchema } from '../../api/proxy/k/search/schema'
import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import Error400 from './Error400'
import SearchResults from './SearchResults'
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
  const validationResult = GETProxyKSearchSchema.safeParse(await searchParams)

  if (!validationResult.success) {
    return <Error400 message={validationResult.error.issues[0].message} />
  }

  const {
    view,
    sort,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    'min-rating': minRating,
    'max-rating': maxRating,
    from,
    to,
    'next-id': nextId,
    skip,
  } = validationResult.data

  const hasActiveFilters = Boolean(
    from ?? to ?? sort ?? nextId ?? minView ?? maxView ?? minPage ?? maxPage ?? minRating ?? maxRating ?? skip,
  )

  return (
    <>
      {hasActiveFilters ? (
        <div className="gap-2 mb-2 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">적용된 필터</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={validationResult.data} />
        </div>
      ) : (
        <TrendingKeywords />
      )}
      <SearchResults sort={sort} view={view} />
    </>
  )
}
