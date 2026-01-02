'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Bell, Book, Check, Filter, Loader2, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { NotificationFilter } from '@/backend/api/v1/notification/types'
import { QueryKeys } from '@/constants/query'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useServerAction from '@/hook/useServerAction'
import useMeQuery from '@/query/useMeQuery'

import { deleteNotifications, markAsRead } from './action'
import { SearchParams } from './common'
import NotificationCard from './NotificationCard'
import SwipeableWrapper from './SwipeableNotificationCard'
import Unauthorized from './Unauthorized'
import useBatcher from './useBatcher'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get(SearchParams.FILTER) as NotificationFilter | null
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotificationInfiniteQuery()
  const notifications = useMemo(() => data?.pages.flatMap((page) => page.notifications) ?? [], [data])
  const groupedNotifications = groupNotificationsByDate(notifications)
  const queryClient = useQueryClient()

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const [, dispatchMarkAsRead, isMarkAsReadPending] = useServerAction({
    action: markAsRead,
    onSuccess: () => {
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.notificationUnreadCount })
    },
    shouldSetResponse: false,
  })

  const [, dispatchDeleteNotifications, isDeleteNotificationsPending] = useServerAction({
    action: deleteNotifications,
    onSuccess: (data) => {
      toast.success(data)
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.notificationUnreadCount })
    },
    shouldSetResponse: false,
  })

  const { addToQueue: handleMarkAsRead } = useBatcher({
    batchDelay: 3000,
    onBatchStart: (ids) => {
      if (ids.length > 0) {
        dispatchMarkAsRead({ ids })
      }
    },
  })

  const handleDelete = useCallback(
    (id: number) => {
      dispatchDeleteNotifications({ ids: [id] })
    },
    [dispatchDeleteNotifications],
  )

  const handleBatchAction = useCallback(
    (action: 'delete' | 'read') => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      if (action === 'read') {
        dispatchMarkAsRead({ ids })
      } else {
        dispatchDeleteNotifications({ ids })
      }
    },
    [selectedIds, dispatchMarkAsRead, dispatchDeleteNotifications],
  )

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  return (
    <>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-zinc-800 -mx-4 px-3 py-2 sm:-mx-6 sm:px-4 sm:py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hidden">
            <FilterButton
              active={!filter}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              onClick={() => router.replace(`?`)}
            >
              <span>전체</span>
            </FilterButton>
            <FilterButton
              active={filter === NotificationFilter.UNREAD}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              onClick={() => router.replace(`?filter=${NotificationFilter.UNREAD}`)}
            >
              <span>읽지 않음</span>
            </FilterButton>
            <FilterButton
              active={filter === NotificationFilter.NEW_MANGA}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              icon={<Book className="size-5 shrink-0" />}
              onClick={() => router.replace(`?filter=${NotificationFilter.NEW_MANGA}`)}
            >
              <span className="hidden sm:inline">신규</span>
            </FilterButton>
          </div>
          <div className="flex items-center gap-1.5">
            {filter === NotificationFilter.UNREAD && (
              <button
                className="px-2.5 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
                disabled={notifications.length === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                onClick={() => dispatchMarkAsRead({ ids: notifications.filter((n) => !n.read).map((n) => n.id) })}
              >
                모두 읽음
              </button>
            )}
            {selectionMode ? (
              <>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition disabled:opacity-50"
                  disabled={selectedIds.size === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                  onClick={() => handleBatchAction('read')}
                >
                  {isMarkAsReadPending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                  <span className="hidden sm:inline">읽음</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-red-400 bg-red-900/20 rounded-md hover:bg-red-900/30 transition disabled:opacity-50"
                  disabled={selectedIds.size === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                  onClick={() => handleBatchAction('delete')}
                >
                  {isDeleteNotificationsPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Trash2 className="size-5" />
                  )}
                  <span className="hidden sm:inline">삭제</span>
                </button>
                <button
                  className="px-2.5 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
                  disabled={isMarkAsReadPending || isDeleteNotificationsPending}
                  onClick={() => {
                    setSelectionMode(false)
                    setSelectedIds(new Set())
                  }}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
                disabled={notifications.length === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                onClick={() => setSelectionMode(true)}
                title="선택 모드"
              >
                <Filter className="size-5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
      {isLoading || isMeLoading ? (
        <div className="flex-1 flex items-center justify-center animate-fade-in [animation-delay:0.3s] [animation-fill-mode:both]">
          <Loader2 className="size-10 shrink-0 text-zinc-600 animate-spin sm:size-12" />
        </div>
      ) : !me ? (
        <Unauthorized />
      ) : notifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div
          aria-current={selectionMode}
          aria-disabled={isMarkAsReadPending || isDeleteNotificationsPending}
          className="grid gap-6 py-4 transition aria-disabled:opacity-70 aria-disabled:pointer-events-none"
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
                    onDelete={handleDelete}
                    onMarkAsRead={handleMarkAsRead}
                  >
                    <NotificationCard
                      autoMarkAsRead={!selectionMode && filter !== NotificationFilter.UNREAD}
                      notification={notification}
                      onDelete={handleDelete}
                      onMarkAsRead={handleMarkAsRead}
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
            {isFetchingNextPage && <Loader2 className="size-5 shrink-0 animate-spin text-zinc-600" />}
          </div>
        </div>
      )}
    </>
  )
}

function EmptyState({ filter }: { filter: NotificationFilter | null }) {
  const content = getEmptyContent(filter)
  const { data: me } = useMeQuery()
  const username = me?.name ?? ''
  const showKeywordSetting = content.showKeywordSetting

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative">
        {content.icon}
        <div className="absolute inset-0 bg-linear-to-t from-brand/10 to-transparent rounded-full blur-3xl" />
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-2">{content.title}</h3>
      <p className="text-sm text-zinc-500 text-center max-w-xs">{content.description}</p>
      {showKeywordSetting && (
        <div className="mt-4 flex items-center gap-2">
          <a
            aria-label="푸시 알림 설정으로 이동"
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-brand text-background hover:opacity-90 transition"
            href={`/@${username}/settings#push`}
          >
            푸시 알림 켜기
          </a>
          <a
            aria-label="키워드 알림 설정으로 이동"
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
            href={`/@${username}/settings#keyword`}
          >
            키워드 알림 설정
          </a>
        </div>
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  icon,
  disabled = false,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      aria-pressed={active}
      className="relative px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap
      aria-pressed:bg-brand aria-pressed:text-background aria-pressed:font-bold
      bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-zinc-200
      disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}

function getEmptyContent(filter: NotificationFilter | null) {
  switch (filter) {
    case NotificationFilter.NEW_MANGA:
      return {
        icon: <Book className="mb-4 size-12 text-zinc-600/50" />,
        title: '신규 작품 알림이 없어요',
        description: '새로운 작품이 추가되면 알려드릴게요',
      }
    case NotificationFilter.UNREAD:
      return {
        icon: <Check className="mb-4 size-12 text-zinc-600/50" />,
        title: '모든 알림을 확인했어요',
        description: '새로운 알림이 도착하면 여기에 표시돼요',
      }
    default:
      return {
        icon: <Bell className="mb-4 size-12 text-zinc-600/50" />,
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
