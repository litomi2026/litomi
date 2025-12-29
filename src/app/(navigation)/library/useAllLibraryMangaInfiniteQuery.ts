import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1LibraryMangaResponse } from '@/backend/api/v1/library/manga'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

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
  const { data } = await fetchWithErrorHandling<GETV1LibraryMangaResponse>(url, { credentials: 'include' })
  return data
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
