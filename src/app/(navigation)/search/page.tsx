import { Metadata } from 'next'
import { cookies } from 'next/headers'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { PageProps } from '@/types/nextjs'
import { getCookieJSON } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import { GETProxyKSearchSchema } from '../../api/proxy/k/search/schema'
import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import Error400 from './Error400'
import SearchResults from './SearchResults'

export const metadata: Metadata = {
  title: `검색 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `검색 - ${SHORT_NAME}`,
    url: '/search',
  },
  alternates: {
    canonical: '/search',
    languages: { ko: '/search' },
  },
}

export default async function Page({ searchParams }: PageProps) {
  const [cookieStore, searchParamsJSON] = await Promise.all([cookies(), searchParams])

  const validationResult = GETProxyKSearchSchema.safeParse({
    ...getCookieJSON(cookieStore, ['view']),
    ...searchParamsJSON,
  })

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

  const viewType = view === 'img' ? ViewCookie.IMAGE : ViewCookie.CARD

  const hasActiveFilters = Boolean(
    from ?? to ?? sort ?? nextId ?? minView ?? maxView ?? minPage ?? maxPage ?? minRating ?? maxRating ?? skip,
  )

  return (
    <>
      {hasActiveFilters && (
        <div className="gap-2 mb-4 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">적용된 필터</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={validationResult.data} />
        </div>
      )}
      <SearchResults view={viewType} />
    </>
  )
}
