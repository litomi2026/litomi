import { useQuery } from '@tanstack/react-query'

import { GETBookmarksResponse } from '@/app/api/bookmark/route'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchBookmarks() {
  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark`, { credentials: 'include' })
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
