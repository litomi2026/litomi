import type { GETV1LibraryMangaResponse } from '@litomi/contracts/api/library'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchAllLibraryMangas({ cursor, userId }: { cursor: string | null; userId?: number }) {
  const params = new URLSearchParams()
  params.set('scope', userId ? 'me' : 'public')

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/manga?${params}`
  const { data } = await fetchWithErrorHandling<GETV1LibraryMangaResponse>(url, { credentials: 'include' })
  return data
}

export default function useAllLibraryMangaInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteLibraryMangas(),
    queryFn: ({ pageParam }) => fetchAllLibraryMangas({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
