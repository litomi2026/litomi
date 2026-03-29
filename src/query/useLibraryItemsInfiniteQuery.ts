import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/item/GET'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@/backend/api/v1/library/item-sort'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

interface FetchLibraryItemsOptions {
  cursor: string | null
  libraryId: number
  scope: 'me' | 'public'
  sort: CollectionItemSort
}

interface Options {
  enabled?: boolean
  initialItems?: GETLibraryItemsResponse
  libraryId: number
  scope: 'me' | 'public'
  sort?: CollectionItemSort
}

export async function fetchLibraryItems({ libraryId, cursor, scope, sort }: FetchLibraryItemsOptions) {
  const params = new URLSearchParams()
  params.set('scope', scope)

  if (cursor) {
    params.set('cursor', cursor)
  }

  if (sort) {
    params.set('sort', sort)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}/item?${params}`
  const { data } = await fetchWithErrorHandling<GETLibraryItemsResponse>(url, { credentials: 'include' })
  return data
}

export default function useLibraryItemsInfiniteQuery({
  libraryId,
  initialItems,
  scope,
  enabled,
  sort = DEFAULT_COLLECTION_ITEM_SORT,
}: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.libraryItems(libraryId, scope, sort),
    queryFn: async ({ pageParam }) => fetchLibraryItems({ libraryId, cursor: pageParam, scope, sort }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    ...(initialItems && {
      initialData: {
        pages: [initialItems],
        pageParams: [''],
      },
    }),
    enabled: Boolean(libraryId) && enabled,
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
