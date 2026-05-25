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

export async function fetchLibraryList({ cursor, userId }: { cursor: string | null; userId?: number }) {
  const params = new URLSearchParams()
  params.set('scope', userId ? 'all' : 'public')

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library?${params}`
  const { data } = await fetchAPIData<GETV1LibraryListResponse>(url, { credentials: 'include' })
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
