import type { GETV1BookmarkIdResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

export async function fetchBookmarkIds() {
  const url = '/api/v1/bookmark/id'
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
