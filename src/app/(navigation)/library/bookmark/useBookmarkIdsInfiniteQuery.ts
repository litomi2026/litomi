import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/get'

import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchPaginatedBookmarks(cursor: string | null) {
  const params = new URLSearchParams({ limit: BOOKMARKS_PER_PAGE.toString() })

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark?${params}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1BookmarkResponse>(response)
}

export default function useBookmarkIdsInfiniteQuery(initialData?: GETV1BookmarkResponse) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteBookmarks,
    queryFn: ({ pageParam }: { pageParam: string | null }) => fetchPaginatedBookmarks(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initialData && {
      pages: [initialData],
      pageParams: [null],
    },
    initialPageParam: null,
  })
}
