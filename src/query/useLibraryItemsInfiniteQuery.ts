import { useInfiniteQuery } from '@tanstack/react-query'

import { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/item/GET'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

interface FetchLibraryItemsOptions {
  cursor: string | null
  libraryId: number
  scope: 'me' | 'public'
}

interface Options {
  enabled?: boolean
  initialItems: GETLibraryItemsResponse
  libraryId: number
  scope: 'me' | 'public'
}

export async function fetchLibraryItems({ libraryId, cursor, scope }: FetchLibraryItemsOptions) {
  const params = new URLSearchParams()
  params.set('scope', scope)

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}/item?${params}`
  const { data } = await fetchWithErrorHandling<GETLibraryItemsResponse>(url, { credentials: 'include' })
  return data
}

export default function useLibraryItemsInfiniteQuery({ libraryId, initialItems, scope, enabled }: Options) {
  return useInfiniteQuery<GETLibraryItemsResponse>({
    queryKey: QueryKeys.libraryItems(libraryId),
    queryFn: async ({ pageParam }) => fetchLibraryItems({ libraryId, cursor: pageParam as string, scope }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    initialData: {
      pages: [initialItems],
      pageParams: [null],
    },
    enabled: Boolean(libraryId) && enabled,
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
