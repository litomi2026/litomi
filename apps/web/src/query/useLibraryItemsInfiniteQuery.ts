import type { GETLibraryItemsResponse } from '@litomi/contracts'

import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort } from '@litomi/domain/library/sort'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

interface FetchLibraryItemsOptions {
  cursor: string | null
  libraryId: number
  locale: string
  scope: 'me' | 'public'
  sort: LibraryItemSort
}

interface Options {
  enabled?: boolean
  libraryId: number
  scope: 'me' | 'public'
  sort?: LibraryItemSort
}

export async function fetchLibraryItems({ libraryId, cursor, locale, scope, sort }: FetchLibraryItemsOptions) {
  const url = new URL(`/api/v1/library/${libraryId}/item`, NEXT_PUBLIC_API_ORIGIN)
  url.searchParams.set('locale', locale)
  url.searchParams.set('scope', scope)
  url.searchParams.set('sort', sort)

  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  const credentials = scope === 'me' ? 'same-origin' : 'omit'
  const { data } = await fetchAPIData<GETLibraryItemsResponse>(url, { credentials })
  return data
}

export default function useLibraryItemsInfiniteQuery({
  enabled = true,
  libraryId,
  scope,
  sort = DEFAULT_LIBRARY_ITEM_SORT,
}: Options) {
  const locale = useLocale()

  return useInfiniteQuery({
    queryKey: QueryKeys.libraryItems(libraryId, scope, sort, locale),
    queryFn: async ({ pageParam }) => fetchLibraryItems({ libraryId, cursor: pageParam, locale, scope, sort }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled: Boolean(libraryId) && enabled,
    meta: scope === 'me' ? { requiresAdult: true } : undefined,
  })
}
