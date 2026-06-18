import type { GETV1LibraryListResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

interface Options {
  enabled?: boolean
  userId?: number
}

export async function fetchPinnedLibraryList({ cursor }: { cursor: string | null }) {
  const params = buildSearchParams({ scope: 'pinned', cursor })
  const url = `/api/v1/library?${params}`
  const { data } = await fetchAPIData<GETV1LibraryListResponse>(url)
  return data
}

export default function usePinnedLibraryListInfiniteQuery({ enabled = true, userId }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infinitePinnedLibraryList(userId),
    queryFn: ({ pageParam }) => fetchPinnedLibraryList({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
