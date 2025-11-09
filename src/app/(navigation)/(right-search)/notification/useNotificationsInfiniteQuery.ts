import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETNotificationResponse } from '@/backend/api/v1/notification'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchNotifications(searchParams: URLSearchParams) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/notification?${searchParams}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETNotificationResponse>(response)
}

export default function useNotificationInfiniteQuery() {
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()

  return useInfiniteQuery<GETNotificationResponse, Error>({
    queryKey: QueryKeys.notifications(searchParams),
    queryFn: ({ pageParam }) => {
      const queryParams = new URLSearchParams()
      if (pageParam) {
        queryParams.set('nextId', pageParam.toString())
      }
      const filters = searchParams.getAll('filter')
      for (const filter of filters) {
        queryParams.append('filter', filter)
      }
      return fetchNotifications(queryParams)
    },
    getNextPageParam: ({ hasNextPage, notifications }) =>
      hasNextPage ? notifications[notifications.length - 1]?.id.toString() : null,
    initialPageParam: undefined,
    enabled: Boolean(me),
  })
}
