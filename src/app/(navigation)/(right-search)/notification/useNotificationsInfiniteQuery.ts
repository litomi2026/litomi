import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { GETNotificationResponse } from '@/app/api/notification/route'
import { NotificationFilter } from '@/app/api/notification/schema'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchNotifications(searchParams: URLSearchParams) {
  const response = await fetch(`/api/notification?${searchParams}`)
  return handleResponseError<GETNotificationResponse>(response)
}

export default function useNotificationInfiniteQuery() {
  const searchParams = useSearchParams()

  return useInfiniteQuery<GETNotificationResponse, Error>({
    queryKey: QueryKeys.notifications(searchParams),
    queryFn: ({ pageParam }) => {
      const queryParams = new URLSearchParams()
      if (pageParam) {
        queryParams.set('nextId', pageParam.toString())
      }
      const filter = searchParams.get('filter')
      if (filter && filter !== NotificationFilter.ALL) {
        queryParams.set('filter', filter)
      }
      const types = searchParams.getAll('type')
      if (types.length > 0) {
        for (const type of types) {
          queryParams.append('type', type)
        }
      }
      return fetchNotifications(queryParams)
    },
    getNextPageParam: ({ hasNextPage, notifications }) =>
      hasNextPage ? notifications[notifications.length - 1]?.id.toString() : null,
    initialPageParam: undefined,
  })
}
