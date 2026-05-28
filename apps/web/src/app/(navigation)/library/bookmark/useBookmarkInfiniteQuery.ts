import type { GETV1BookmarkResponse } from '@litomi/contracts'

import { BOOKMARKS_PER_PAGE } from '@litomi/domain/library/policy'
import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Options = {
  enabled?: boolean
  sort?: CollectionItemSort
}

export async function fetchPaginatedBookmark(cursor: string | null, sort: CollectionItemSort) {
  const params = new URLSearchParams({ limit: BOOKMARKS_PER_PAGE.toString() })

  if (cursor) {
    params.set('cursor', cursor)
  }

  if (sort) {
    params.set('sort', sort)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/bookmark?${params}`
  const { data } = await fetchAPIData<GETV1BookmarkResponse>(url, { credentials: 'include' })
  return data
}

export default function useBookmarkInfiniteQuery({
  enabled = true,
  sort = DEFAULT_COLLECTION_ITEM_SORT,
}: Options = {}) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteBookmarks(sort),
    queryFn: ({ pageParam }) => fetchPaginatedBookmark(pageParam, sort),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
