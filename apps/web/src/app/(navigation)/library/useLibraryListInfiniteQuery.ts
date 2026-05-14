import type { GETV1LibraryListResponse } from '@litomi/contracts/api/library'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

interface Options {
  enabled?: boolean
  userId?: number
}

export async function fetchLibraryList({ cursor, userId }: { cursor: string | null; userId?: number }) {
  const params = new URLSearchParams()
  params.set('scope', userId ? 'all' : 'public')

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library?${params}`
  const { data } = await fetchWithErrorHandling<GETV1LibraryListResponse>(url, { credentials: 'include' })
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
