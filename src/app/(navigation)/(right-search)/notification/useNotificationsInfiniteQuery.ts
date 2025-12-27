import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETNotificationResponse } from '@/backend/api/v1/notification'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

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
