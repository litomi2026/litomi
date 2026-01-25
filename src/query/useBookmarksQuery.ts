import { useQuery } from '@tanstack/react-query'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchBookmarks() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark`
  const { data } = await fetchWithErrorHandling<GETV1BookmarkResponse>(url, { credentials: 'include' })
  return data
}

export default function useBookmarksQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id
  const canAccess = canAccessAdultRestrictedAPIs(me)

  return useQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: fetchBookmarks,
    enabled: Boolean(userId) && canAccess,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    meta: { requiresAdult: true },
  })
}
