import type { GETV1BookmarkResponse } from '@litomi/contracts'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/contracts'
import { BOOKMARKS_PER_PAGE } from '@litomi/domain/constants/policy'
import { env } from '@litomi/env/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchPaginatedBookmark(cursor: string | null, sort: CollectionItemSort) {
  const params = new URLSearchParams({ limit: BOOKMARKS_PER_PAGE.toString() })

  if (cursor) {
    params.set('cursor', cursor)
  }

  if (sort) {
    params.set('sort', sort)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/bookmark?${params}`
  const { data } = await fetchWithErrorHandling<GETV1BookmarkResponse>(url, { credentials: 'include' })
  return data
}

export default function useBookmarkInfiniteQuery(
  initialData?: GETV1BookmarkResponse,
  sort: CollectionItemSort = DEFAULT_COLLECTION_ITEM_SORT,
) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteBookmarks(sort),
    queryFn: ({ pageParam }) => fetchPaginatedBookmark(pageParam, sort),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialData && { initialData: { pages: [initialData], pageParams: [''] } }),
    initialPageParam: '',
  })
}
