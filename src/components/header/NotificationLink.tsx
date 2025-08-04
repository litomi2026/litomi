'use client'

import { useQuery } from '@tanstack/react-query'

import IconBell from '@/components/icons/IconBell'
import SelectableLink from '@/components/SelectableLink'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'

type Props = {
  className?: string
}

export default function NotificationLink({ className }: Readonly<Props>) {
  const { data: unreadCount } = useNotificationUnreadCountQuery()

  return (
    <div className="relative">
      <SelectableLink className={className} href="/notification" Icon={IconBell}>
        알림
      </SelectableLink>
      {unreadCount > 0 && (
        <span
          className="absolute right-1 top-1 flex h-4 px-1 items-center justify-center rounded-full bg-brand-end text-[10px] font-bold text-background
          2xl:right-2 2xl:top-1/2 2xl:-translate-y-1/2 2xl:text-xs 2xl:h-5 2xl:px-2"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  )
}

function useNotificationUnreadCountQuery() {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.notificationUnreadCount,
    queryFn: () => fetch('/api/notification/unread-count').then((res) => res.json()),
    enabled: !!me,
  })
}
