import { useQuery } from '@tanstack/react-query'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/get'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_BACKEND_URL } = env

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
