'use client'

import type { GETV1NotificationUnreadCountResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'
import { twMerge } from 'tailwind-merge'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'

export default function NotificationCount() {
  const { data: unreadCount } = useNotificationUnreadCountQuery()

  if (!unreadCount) {
    return null
  }

  return (
    <span
      className={twMerge(
        'absolute top-1/2 -translate-y-4.5 right-1/2 translate-x-4.5 tabular-nums flex h-4 px-1 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-background',
        '2xl:right-2 2xl:top-1/2 2xl:-translate-y-1/2 2xl:translate-x-0 2xl:text-xs 2xl:h-5 2xl:px-2',
      )}
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}

async function fetchUnreadCount() {
  const url = '/api/v1/notification/unread-count'
  const { data } = await fetchAPIData<GETV1NotificationUnreadCountResponse>(url)
  return data
}

function useNotificationUnreadCountQuery() {
  const { data: me } = useMeQuery()

  return useQuery<GETV1NotificationUnreadCountResponse>({
    queryKey: QueryKeys.notificationUnreadCount,
    queryFn: fetchUnreadCount,
    enabled: hasAdultAccess(me),
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
