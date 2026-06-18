import type { GETNotificationResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

export async function fetchNotifications(cursor: string | null, filters: string[]) {
  const searchParams = buildSearchParams({
    nextId: cursor,
    filter: filters,
  })

  const url = `/api/v1/notification?${searchParams}`
  const { data } = await fetchAPIData<GETNotificationResponse>(url)
  return data
}

export default function useNotificationInfiniteQuery() {
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()

  return useInfiniteQuery<GETNotificationResponse, Error>({
    queryKey: QueryKeys.notifications(searchParams),
    queryFn: ({ pageParam }) => fetchNotifications(pageParam as string | null, searchParams.getAll('filter')),
    getNextPageParam: ({ hasNextPage, notifications }) =>
      hasNextPage ? notifications[notifications.length - 1]?.id.toString() : null,
    initialPageParam: undefined,
    enabled: hasAdultAccess(me),
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
