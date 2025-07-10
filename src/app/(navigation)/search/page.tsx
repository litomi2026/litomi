import { Suspense } from '@suspensive/react'
import { cookies } from 'next/headers'

import { BasePageProps } from '@/types/nextjs'
import { getCookieJSON } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import ActiveFilters from './ActiveFilters'
import Error400 from './Error400'
import Loading from './loading'
import { MangaSearchSchema } from './schema'
import SearchResults from './SearchResults'

export default async function Page({ searchParams }: BasePageProps) {
  const [cookieStore, searchParamsJSON] = await Promise.all([cookies(), searchParams])

  const validationResult = MangaSearchSchema.safeParse({
    ...getCookieJSON(cookieStore, ['view']),
    ...searchParamsJSON,
  })

  if (!validationResult.success) {
    return <Error400 />
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
      {hasActiveFilters && (
        <Suspense>
          <ActiveFilters filters={validationResult.data} />
        </Suspense>
      )}
      <Suspense clientOnly fallback={<Loading />}>
        <SearchResults view={viewType} />
      </Suspense>
    </>
  )
}
