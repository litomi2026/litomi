import { useInfiniteQuery } from '@tanstack/react-query'

import { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/GET'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

interface Options {
  initialItems: GETLibraryItemsResponse
  libraryId: number
}

export async function fetchLibraryItems(libraryId: number, cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}?${params}`
  const { data } = await fetchWithErrorHandling<GETLibraryItemsResponse>(url, { credentials: 'include' })
  return data
}

export default function useLibraryItemsInfiniteQuery({ libraryId, initialItems }: Options) {
  return useInfiniteQuery<GETLibraryItemsResponse>({
    queryKey: QueryKeys.libraryItems(libraryId),
    queryFn: async ({ pageParam }) => fetchLibraryItems(libraryId, pageParam as string),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    initialData: {
      pages: [initialItems],
      pageParams: [null],
    },
    enabled: Boolean(libraryId),
  })
}
