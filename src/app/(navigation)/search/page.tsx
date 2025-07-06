import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { BasePageProps } from '@/types/nextjs'
import { getJSONCookie } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import ActiveFilters from './ActiveFilters'
import SearchResults from './SearchResults'
import { MangaSearchSchema } from './searchValidation'

export default async function Page({ searchParams }: BasePageProps) {
  const [cookieStore, searchParamsJSON] = await Promise.all([cookies(), searchParams])

  const validationResult = MangaSearchSchema.safeParse({
    ...getJSONCookie(cookieStore, ['view']),
    ...searchParamsJSON,
  })

  if (!validationResult.success) {
    notFound()
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
      <SearchResults view={viewType} />
    </>
  )
}
