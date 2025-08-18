import { Suspense } from '@suspensive/react'
import { Metadata } from 'next'
import { cookies } from 'next/headers'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { PageProps } from '@/types/nextjs'
import { getCookieJSON } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import { GETProxyKSearchSchema } from '../../api/proxy/k/search/schema'
import ActiveFilters from './ActiveFilters'
import Error400 from './Error400'
import Loading from './loading'
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
    from,
    to,
    'next-id': nextId,
    skip,
  } = validationResult.data

  const viewType = view === 'img' ? ViewCookie.IMAGE : ViewCookie.CARD
  const hasActiveFilters = Boolean(from ?? to ?? sort ?? nextId ?? minView ?? maxView ?? minPage ?? maxPage ?? skip)

  return (
    <>
      {hasActiveFilters && <ActiveFilters filters={validationResult.data} />}
      <Suspense clientOnly fallback={<Loading />}>
        <SearchResults view={viewType} />
      </Suspense>
    </>
  )
}
