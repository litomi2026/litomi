import { useQuery } from '@tanstack/react-query'

import { GETBookmarksResponse } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchBookmarks() {
  const response = await fetch('/api/bookmarks')
  return handleResponseError<GETBookmarksResponse>(response)
}

export default function useBookmarksQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: fetchBookmarks,
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
}
