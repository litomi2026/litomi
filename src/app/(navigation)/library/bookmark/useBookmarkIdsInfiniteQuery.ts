import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

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
