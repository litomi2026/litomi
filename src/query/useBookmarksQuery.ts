import { useQuery } from '@tanstack/react-query'

import { GETBookmarksResponse } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchBookmarkIds() {
  const response = await fetch('/api/bookmarks')
  const data = await handleResponseError<GETBookmarksResponse>(response)
  return new Set(data.bookmarks.map((bookmark) => bookmark.mangaId))
}

export default function useBookmarksQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: fetchBookmarkIds,
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
}
