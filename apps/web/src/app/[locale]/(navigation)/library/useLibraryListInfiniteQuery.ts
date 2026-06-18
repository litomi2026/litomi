import type { GETV1LibraryListResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

interface Options {
  enabled?: boolean
  userId?: number
}

export async function fetchLibraryList({ cursor, userId }: { cursor: string | null; userId?: number }) {
  const params = buildSearchParams({
    cursor,
    scope: userId ? 'all' : 'public',
  })

  const url = `/api/v1/library?${params}`
  const { data } = await fetchAPIData<GETV1LibraryListResponse>(url)
  return data
}

export default function useLibraryListInfiniteQuery({ enabled = true, userId }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteLibraryList(userId),
    queryFn: ({ pageParam }) => fetchLibraryList({ cursor: pageParam, userId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
