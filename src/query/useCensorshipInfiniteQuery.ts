import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1CensorshipResponse } from '@/backend/api/v1/censorship'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

type Params = {
  pageParam?: string
}

export async function fetchPaginatedCensorships({ pageParam }: Params) {
  const params = new URLSearchParams()

  if (pageParam) {
    params.set('cursor', pageParam)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/censorship?${params}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1CensorshipResponse>(response)
}

export default function useCensorshipsInfiniteQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteCensorships,
    queryFn: ({ pageParam }: Params) => fetchPaginatedCensorships({ pageParam }),
    enabled: Boolean(userId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
