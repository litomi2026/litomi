'use client'

import { useQuery } from '@tanstack/react-query'

import { GETUnreadCountResponse } from '@/backend/api/v1/notification/unread-count'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function NotificationCount() {
  const { data: unreadCount } = useNotificationUnreadCountQuery()

  if (!unreadCount) {
    return null
  }

  return (
    <span
      className="absolute top-1/2 -translate-y-5 right-1/2 translate-x-5 flex h-4 px-1 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-background
      2xl:right-2 2xl:top-1/2 2xl:-translate-y-1/2 2xl:translate-x-0 2xl:text-xs 2xl:h-5 2xl:px-2"
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}

async function fetchUnreadCount() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/notification/unread-count`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETUnreadCountResponse>(response)
}

function useNotificationUnreadCountQuery() {
  const { data: me } = useMeQuery()

  return useQuery<GETUnreadCountResponse>({
    queryKey: QueryKeys.notificationUnreadCount,
    queryFn: fetchUnreadCount,
    enabled: Boolean(me),
  })
}
