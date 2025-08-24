import { useInfiniteQuery } from '@tanstack/react-query'

import { GETLibraryItemsResponse } from '@/app/api/library/[id]/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

interface Options {
  initialItems: GETLibraryItemsResponse
  libraryId: number
}

export async function fetchLibraryItems(libraryId: number, cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const response = await fetch(`/api/library/${libraryId}?${params}`)
  return handleResponseError<GETLibraryItemsResponse>(response)
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
