import { useInfiniteQuery } from '@tanstack/react-query'

import { GETBookmarksResponse } from '@/app/api/bookmark/route'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchBookmarksPaginated(cursor: { mangaId: number; createdAt: number } | null) {
  const searchParams = new URLSearchParams()
  searchParams.append('limit', BOOKMARKS_PER_PAGE.toString())

  if (cursor) {
    searchParams.append('cursorId', cursor.mangaId.toString())
    searchParams.append('cursorTime', cursor.createdAt.toString())
  }

  const response = await fetch(`/api/bookmark?${searchParams}`)
  return handleResponseError<GETBookmarksResponse>(response)
}

export default function useBookmarkIdsInfiniteQuery(initialData?: GETBookmarksResponse) {
  return useInfiniteQuery<GETBookmarksResponse, Error>({
    queryKey: QueryKeys.infiniteBookmarks,
    queryFn: ({ pageParam }) => fetchBookmarksPaginated(pageParam as { mangaId: number; createdAt: number } | null),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initialData && {
      pages: [initialData],
      pageParams: [null],
    },
    initialPageParam: null,
  })
}
