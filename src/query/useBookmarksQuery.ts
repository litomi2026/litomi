import { useSuspenseQuery } from '@tanstack/react-query'

import { GETBookmarksResponse } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError, shouldRetryError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export default function useBookmarksQuery() {
  const { data: me } = useMeQuery()

  return useSuspenseQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: me ? fetchBookmarkIds : () => null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    retry: (failureCount, error) => shouldRetryError(error, failureCount),

    // 로그인 후 queryClient.invalidateQueries({ queryKey: QueryKeys.me }) 로직이 효과가 있으려면?
    gcTime: 0,
  })
}

async function fetchBookmarkIds(): Promise<Set<number> | null> {
  const response = await fetch('/api/bookmarks')
  const data = await handleResponseError<GETBookmarksResponse>(response)
  return new Set(data.bookmarks.map((bookmark) => bookmark.mangaId))
}
