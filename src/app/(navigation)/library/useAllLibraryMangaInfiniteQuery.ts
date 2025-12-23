import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1LibraryMangaResponse } from '@/backend/api/v1/library/manga'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

interface Options {
  enabled?: boolean
  userId: number | null
}

export async function fetchAllLibraryMangas(cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/manga?${params}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1LibraryMangaResponse>(response)
}

export default function useAllLibraryMangaInfiniteQuery({ userId, enabled = true }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteLibraryMangas(userId),
    queryFn: ({ pageParam }) => fetchAllLibraryMangas(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
