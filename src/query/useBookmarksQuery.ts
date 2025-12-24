import { useQuery } from '@tanstack/react-query'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/get'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchBookmarks() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1BookmarkResponse>(response)
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
