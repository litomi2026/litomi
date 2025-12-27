import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1LibraryListResponse } from '@/backend/api/v1/library/list'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

interface Options {
  enabled?: boolean
  userId: number | null
}

export async function fetchLibraryList(cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/list?${params}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1LibraryListResponse>(response)
}

export default function useLibraryListInfiniteQuery({ enabled = true, userId }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteLibraryList(userId),
    queryFn: ({ pageParam }) => fetchLibraryList(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
