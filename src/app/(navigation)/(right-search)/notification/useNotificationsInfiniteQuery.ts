import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import type { GETNotificationResponse } from '@/backend/api/v1/notification/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchNotifications(searchParams: URLSearchParams) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/notification?${searchParams}`
  const { data } = await fetchWithErrorHandling<GETNotificationResponse>(url, { credentials: 'include' })
  return data
}

export default function useNotificationInfiniteQuery() {
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)

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
    enabled: hasAdultAccess(adultState),
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
