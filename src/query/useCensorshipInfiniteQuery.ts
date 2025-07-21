import { useInfiniteQuery } from '@tanstack/react-query'

import { GETCensorshipsResponse } from '@/app/api/censorships/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchPaginatedCensorships({ pageParam }: { pageParam?: { id: number; createdAt: number } }) {
  const params = new URLSearchParams()
  params.set('limit', '20')

  if (pageParam) {
    params.set('cursorId', pageParam.id.toString())
    params.set('cursorTime', pageParam.createdAt.toString())
  }

  const response = await fetch(`/api/censorships?${params}`)
  return handleResponseError<GETCensorshipsResponse>(response)
}

export default function useCensorshipsInfiniteQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useInfiniteQuery({
    queryKey: QueryKeys.censorships,
    queryFn: fetchPaginatedCensorships,
    enabled: Boolean(userId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
