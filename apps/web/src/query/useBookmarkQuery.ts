import type { GETV1BookmarkIdResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function fetchBookmarkIds() {
  const url = new URL('/api/v1/bookmark/id', NEXT_PUBLIC_APP_ORIGIN)
  const { data } = await fetchAPIData<GETV1BookmarkIdResponse>(url)
  return data
}

export default function useBookmarkQuery() {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: fetchBookmarkIds,
    enabled: me != null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
}
