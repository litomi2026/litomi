import { useInfiniteQuery } from '@tanstack/react-query'

import { GETCensorshipsResponse } from '@/app/api/censorship/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchPaginatedCensorships({ pageParam }: { pageParam?: number }) {
  const params = new URLSearchParams()

  if (pageParam) {
    params.set('cursor', pageParam.toString())
  }

  const response = await fetch(`/api/censorship?${params}`)
  return handleResponseError<GETCensorshipsResponse>(response)
}

export default function useCensorshipsInfiniteQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteCensorships,
    queryFn: fetchPaginatedCensorships,
    enabled: Boolean(userId),
    getNextPageParam: (lastPage) => lastPage.nextCursor?.id,
    initialPageParam: undefined,
  })
}
