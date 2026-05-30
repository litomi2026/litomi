import type { GETV1LibraryListResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

interface Options {
  enabled?: boolean
  userId?: number
}

export async function fetchPinnedLibraryList({ cursor }: { cursor: string | null }) {
  const params = new URLSearchParams({ scope: 'pinned' })

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library?${params}`
  const { data } = await fetchAPIData<GETV1LibraryListResponse>(url, { credentials: 'include' })
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
