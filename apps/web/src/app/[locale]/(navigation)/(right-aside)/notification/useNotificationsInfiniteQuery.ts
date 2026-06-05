import type { GETNotificationResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { apiPath, fetchAPIData } from '@/utils/api-request'

export async function fetchNotifications(searchParams: URLSearchParams) {
  const url = apiPath('/api/v1/notification', searchParams)
  const { data } = await fetchAPIData<GETNotificationResponse>(url)
  return data
}

export default function useNotificationInfiniteQuery() {
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()

  return useInfiniteQuery<GETNotificationResponse, Error>({
    queryKey: QueryKeys.notifications(searchParams),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()

      if (pageParam) {
        params.set('nextId', pageParam.toString())
      }

      for (const filter of searchParams.getAll('filter')) {
        params.append('filter', filter)
      }

      return fetchNotifications(params)
    },
    getNextPageParam: ({ hasNextPage, notifications }) =>
      hasNextPage ? notifications[notifications.length - 1]?.id.toString() : null,
    initialPageParam: undefined,
    enabled: hasAdultAccess(me),
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
