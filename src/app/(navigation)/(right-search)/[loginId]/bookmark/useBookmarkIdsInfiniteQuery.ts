import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

import { BookmarkWithSource, GETBookmarksResponse } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import { BOOKMARKS_PER_PAGE } from './constants'

export async function fetchBookmarksPaginated(
  cursor: { mangaId: number; createdAt: number } | null,
  limit: number = BOOKMARKS_PER_PAGE,
) {
  const searchParams = new URLSearchParams()
  searchParams.append('limit', limit.toString())

  if (cursor) {
    searchParams.append('cursorId', cursor.mangaId.toString())
    searchParams.append('cursorTime', cursor.createdAt.toString())
  }

  const response = await fetch(`/api/bookmarks?${searchParams}`)
  return handleResponseError<GETBookmarksResponse>(response)
}

export default function useBookmarkIdsInfiniteQuery(initialBookmarks: BookmarkWithSource[]) {
  return useSuspenseInfiniteQuery<GETBookmarksResponse, Error>({
    queryKey: QueryKeys.infiniteBookmarks,
    queryFn: ({ pageParam }) => fetchBookmarksPaginated(pageParam as { mangaId: number; createdAt: number } | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [{ bookmarks: initialBookmarks, nextCursor: getNextCursor(initialBookmarks) }],
      pageParams: [null],
    },
  })
}

function getNextCursor(bookmarks: BookmarkWithSource[]) {
  if (bookmarks.length !== BOOKMARKS_PER_PAGE) {
    return null
  }

  const lastBookmark = bookmarks[bookmarks.length - 1]
  return lastBookmark.createdAt ? { mangaId: lastBookmark.mangaId, createdAt: lastBookmark.createdAt } : null
}
