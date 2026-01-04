import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1LibraryListResponse } from '@/backend/api/v1/library/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

interface Options {
  enabled?: boolean
  userId: number | null
}

export async function fetchLibraryList({ cursor, userId }: { cursor: string | null; userId: number | null }) {
  const params = new URLSearchParams()
  params.set('scope', userId ? 'all' : 'public')

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library?${params}`
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
