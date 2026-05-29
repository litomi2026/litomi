'use client'

import { NotificationFilter } from '@litomi/domain/notification/filter'
import { Book, Check, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import IconBell from '@/components/icons/IconBell'
import StatusState, { StatusActionLink } from '@/components/status/StatusState'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'

import { SearchParams } from './common'
import NotificationCard from './NotificationCard'
import { useNotificationSelection } from './NotificationProvider'
import SwipeableWrapper from './SwipeableNotificationCard'
import Unauthorized from './Unauthorized'
import useBatcher from './useBatcher'
import useNotificationActions from './useNotificationActions'
import useNotificationInfiniteQuery from './useNotificationsInfiniteQuery'

interface Notification {
  body: string
  createdAt: string | Date
  data: string | null
  id: number
  read: boolean
  sentAt: string | Date | null
  title: string
  type: number
  userId: number
}

export default function NotificationList() {
  const { data: me } = useMeQuery()
  const searchParams = useSearchParams()
  const { selectedIds, selectionMode, toggleSelection } = useNotificationSelection()
  const { deleteNotification, isActionPending, markNowAsRead } = useNotificationActions()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useNotificationInfiniteQuery()

  const { addToQueue: markAsRead } = useBatcher<number>({
    batchDelay: 3000,
    onBatchStart: markNowAsRead,
  })

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage: Boolean(hasNextPage) && !isFetchNextPageError,
    isFetchingNextPage,
    fetchNextPage,
  })

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? []
  const filter = searchParams.get(SearchParams.FILTER) as NotificationFilter | null
  const groupedNotifications = groupNotificationsByDate(notifications)

  if (me === undefined) {
    return <NotificationLoading />
  }

  if (me === null) {
    return <Unauthorized />
  }

  if (!hasAdultAccess(me)) {
    return (
      <AdultVerificationGate
        description="알림을 확인하려면 익명 성인인증이 필요해요"
        title="성인인증이 필요해요"
        username={me.name}
      />
    )
  }

  if (isLoading) {
    return <NotificationLoading />
  }

  if (notifications.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      aria-current={selectionMode}
      aria-disabled={isActionPending}
      className="grid gap-6 p-3 transition aria-disabled:opacity-70 aria-disabled:pointer-events-none sm:p-4"
    >
      {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
        <div key={dateGroup}>
          <h2 className="mb-3 text-sm font-medium text-zinc-400 bg-background py-1">
            {dateGroup}
            <span className="ml-2 text-xs text-zinc-600">({groupNotifications.length})</span>
          </h2>
          <div className="grid gap-2 sm:gap-3">
            {groupNotifications.map((notification) => (
              <SwipeableWrapper
                enabled={selectionMode}
                key={notification.id}
                notification={notification}
                onDelete={deleteNotification}
                onMarkAsRead={markAsRead}
              >
                <NotificationCard
                  autoMarkAsRead={!selectionMode && filter !== NotificationFilter.UNREAD}
                  notification={notification}
                  onDelete={deleteNotification}
                  onMarkAsRead={markAsRead}
                  onSelect={toggleSelection}
                  selected={selectedIds.has(notification.id)}
                  selectionMode={selectionMode}
                />
              </SwipeableWrapper>
            ))}
          </div>
        </div>
      ))}
      <div className="w-full py-4 flex justify-center" ref={loadMoreRef}>
        {isFetchingNextPage ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-zinc-600" />
        ) : isFetchNextPageError ? (
          <LoadMoreRetryButton containerClassName="" onRetry={fetchNextPage} />
        ) : null}
      </div>
    </div>
  )
}

function EmptyState() {
  const { data: me } = useMeQuery()
  const searchParams = useSearchParams()
  const filter = searchParams.get(SearchParams.FILTER) as NotificationFilter | null
  const content = getEmptyContent(filter)
  const username = me?.name ?? ''
  const showKeywordSetting = content.showKeywordSetting

  return (
    <StatusState description={content.description} icon={content.icon} title={content.title}>
      {showKeywordSetting && (
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <StatusActionLink className="max-w-none" href={`/@${username}/settings#push`}>
            푸시 알림 켜기
          </StatusActionLink>
          <StatusActionLink className="max-w-none" href={`/@${username}/settings#keyword`} variant="secondary">
            키워드 알림 설정
          </StatusActionLink>
        </div>
      )}
    </StatusState>
  )
}

function getEmptyContent(filter: NotificationFilter | null) {
  switch (filter) {
    case NotificationFilter.NEW_MANGA:
      return {
        icon: <Book className="size-8" />,
        title: '신규 작품 알림이 없어요',
        description: '새로운 작품이 추가되면 알려드릴게요',
      }
    case NotificationFilter.UNREAD:
      return {
        icon: <Check className="size-8" />,
        title: '모든 알림을 확인했어요',
        description: '새로운 알림이 도착하면 여기에 표시돼요',
      }
    default:
      return {
        icon: <IconBell className="size-8" />,
        title: '아직 알림이 없어요',
        description: (
          <>
            신규 작품과 새로운 소식을 알려드릴게요
            <br />
            <span className="text-xs text-zinc-500">(알림은 30일 동안 보관돼요)</span>
          </>
        ),
        showKeywordSetting: true,
      }
  }
}

function groupNotificationsByDate(notifications: Notification[]) {
  const groups: { [key: string]: Notification[] } = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  for (const notification of notifications) {
    const date = typeof notification.createdAt === 'string' ? new Date(notification.createdAt) : notification.createdAt
    let groupKey: string

    if (date >= today) {
      groupKey = '오늘'
    } else if (date >= yesterday) {
      groupKey = '어제'
    } else if (date >= weekAgo) {
      groupKey = '이번 주'
    } else {
      groupKey = '이전'
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
  }

  return groups
}

function NotificationLoading() {
  return (
    <div className="flex-1 flex items-center justify-center animate-fade-in [animation-delay:0.3s] [animation-fill-mode:both]">
      <Loader2 className="size-10 shrink-0 text-zinc-600 animate-spin sm:size-12" />
    </div>
  )
}
