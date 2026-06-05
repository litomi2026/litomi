import type { GETV1LibraryListResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

interface Options {
  enabled?: boolean
  userId?: number
}

export async function fetchPinnedLibraryList({ cursor }: { cursor: string | null }) {
  const params = new URLSearchParams({ scope: 'pinned' })

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = withQuery('/api/v1/library', params)
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
