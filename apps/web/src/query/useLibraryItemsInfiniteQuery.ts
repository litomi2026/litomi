import type { GETLibraryItemsResponse } from '@litomi/contracts'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

interface FetchLibraryItemsOptions {
  cursor: string | null
  libraryId: number
  scope: 'me' | 'public'
  sort: CollectionItemSort
}

interface Options {
  enabled?: boolean
  libraryId: number
  scope: 'me' | 'public'
  sort?: CollectionItemSort
}

export async function fetchLibraryItems({ libraryId, cursor, scope, sort }: FetchLibraryItemsOptions) {
  const url = new URL(`/api/v1/library/${libraryId}/item`, NEXT_PUBLIC_API_ORIGIN)
  url.searchParams.set('scope', scope)
  url.searchParams.set('sort', sort)

  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  const credentials = scope === 'me' ? 'include' : 'omit'
  const { data } = await fetchAPIData<GETLibraryItemsResponse>(url, { credentials })
  return data
}

export default function useLibraryItemsInfiniteQuery({
  enabled = true,
  libraryId,
  scope,
  sort = DEFAULT_COLLECTION_ITEM_SORT,
}: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.libraryItems(libraryId, scope, sort),
    queryFn: async ({ pageParam }) => fetchLibraryItems({ libraryId, cursor: pageParam, scope, sort }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled: Boolean(libraryId) && enabled,
    meta: scope === 'me' ? { requiresAdult: true } : undefined,
  })
}
