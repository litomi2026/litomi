import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1LibraryListResponse } from '@/backend/api/v1/library/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

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
  const { data } = await fetchWithErrorHandling<GETV1LibraryListResponse>(url, { credentials: 'include' })
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
