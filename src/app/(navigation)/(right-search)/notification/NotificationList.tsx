'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import IconBell from '@/components/icons/IconBell'
import IconBook from '@/components/icons/IconBook'
import IconBookmark from '@/components/icons/IconBookmark'
import IconCheck from '@/components/icons/IconCheck'
import IconFilter from '@/components/icons/IconFilter'
import IconSpinner from '@/components/icons/IconSpinner'
import IconTrash from '@/components/icons/IconTrash'
import { QueryKeys } from '@/constants/query'
import { NotificationType } from '@/database/enum'
import useActionResponse from '@/hook/useActionResponse'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'

import { deleteNotifications, markAsRead } from './action'
import NotificationCard from './NotificationCard'
import SwipableWrapper from './SwipeableNotificationCard'
import useNotificationInfiniteQuery from './useNotificationsInfiniteQuery'

enum Filter {
  ALL = 'all',
  BOOKMARK = 'bookmark',
  NEW_MANGA = 'new',
  UNREAD = 'unread',
}

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

  const getInitialFilter = (): Filter => {
    const urlFilter = searchParams.get('filter')
    const urlType = searchParams.get('type')

    switch (urlType) {
      case Filter.BOOKMARK:
      case Filter.NEW_MANGA:
        return urlType
    }

    switch (urlFilter) {
      case Filter.UNREAD:
        return urlFilter
    }

    return Filter.ALL
  }

  const [filter, setFilter] = useState(getInitialFilter())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotificationInfiniteQuery()
  const notifications = useMemo(() => data?.pages.flatMap((page) => page.notifications) ?? [], [data])
  const groupedNotifications = groupNotificationsByDate(notifications)
  const queryClient = useQueryClient()

  const updateURL = useCallback(
    (newFilter: Filter) => {
      const params = new URLSearchParams(window.location.search)

      params.delete('filter')
      params.delete('type')
      switch (newFilter) {
        case Filter.ALL:
          break
        case Filter.BOOKMARK:
          params.delete('type')
          params.set('type', String(NotificationType.BOOKMARK_UPDATE))
          break
        case Filter.NEW_MANGA:
          params.delete('type')
          params.set('type', String(NotificationType.NEW_MANGA))
          break
        case Filter.UNREAD:
          params.delete('filter')
          params.set('filter', 'unread')
          break
      }

      router.replace(`?${params.toString()}`)
    },
    [router],
  )

  const handleFilterChange = useCallback(
    (newFilter: Filter) => {
      setFilter(newFilter)
      updateURL(newFilter)
    },
    [updateURL],
  )

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const [_, dispatchMarkAsRead, isMarkAsReadPending] = useActionResponse({
    action: markAsRead,
    onError: (error) => {
      toast.error(error)
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.notificationUnreadCount })
    },
    shouldSetResponse: false,
  })

  const [__, dispatchDeleteNotifications, isDeleteNotificationsPending] = useActionResponse({
    action: deleteNotifications,
    onError: (error) => {
      toast.error(error)
    },
    onSuccess: (data) => {
      toast.success(data)
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.notificationUnreadCount })
    },
    shouldSetResponse: false,
  })

  const handleMarkAsRead = useCallback(
    (id: number) => {
      dispatchMarkAsRead({ ids: [id] })
    },
    [dispatchMarkAsRead],
  )

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
              active={filter === Filter.ALL}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              onClick={() => handleFilterChange(Filter.ALL)}
            >
              <span>전체</span>
            </FilterButton>
            <FilterButton
              active={filter === Filter.UNREAD}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              onClick={() => handleFilterChange(Filter.UNREAD)}
            >
              <span>읽지 않음</span>
            </FilterButton>
            <FilterButton
              active={filter === Filter.BOOKMARK}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              icon={<IconBookmark className="w-4" />}
              onClick={() => handleFilterChange(Filter.BOOKMARK)}
            >
              <span className="hidden sm:inline">북마크</span>
            </FilterButton>
            <FilterButton
              active={filter === Filter.NEW_MANGA}
              disabled={isMarkAsReadPending || isDeleteNotificationsPending}
              icon={<IconBook className="w-4" />}
              onClick={() => handleFilterChange(Filter.NEW_MANGA)}
            >
              <span className="hidden sm:inline">신규</span>
            </FilterButton>
          </div>
          <div className="flex items-center gap-1.5">
            {notifications.filter((n) => !n.read).length > 0 && !selectionMode && (
              <button
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMarkAsReadPending || isDeleteNotificationsPending}
                onClick={() => dispatchMarkAsRead({ ids: notifications.filter((n) => !n.read).map((n) => n.id) })}
                title="Mark all as read"
              >
                모두 읽음
              </button>
            )}
            {selectionMode ? (
              <>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedIds.size === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                  onClick={() => handleBatchAction('read')}
                  title="Mark as read"
                >
                  {isMarkAsReadPending ? <IconSpinner className="w-4" /> : <IconCheck className="w-4" />}
                  <span className="hidden sm:inline">읽음</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-900/20 rounded-md hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedIds.size === 0 || isMarkAsReadPending || isDeleteNotificationsPending}
                  onClick={() => handleBatchAction('delete')}
                  title="Delete"
                >
                  {isDeleteNotificationsPending ? <IconSpinner className="w-4" /> : <IconTrash className="w-4" />}
                  <span className="hidden sm:inline">삭제</span>
                </button>
                <button
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMarkAsReadPending || isDeleteNotificationsPending}
                onClick={() => setSelectionMode(true)}
                title="Select multiple"
              >
                <IconFilter className="w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <IconSpinner className="w-10 text-zinc-600 animate-spin sm:w-12" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div
          aria-current={selectionMode}
          aria-disabled={isMarkAsReadPending || isDeleteNotificationsPending}
          className="grid gap-6 py-4 transition-all aria-current:scale-x-[0.99] aria-disabled:opacity-70 aria-disabled:pointer-events-none"
        >
          {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup}>
              <h2 className="mb-3 text-sm font-medium text-zinc-400 bg-background py-1">
                {dateGroup}
                <span className="ml-2 text-xs text-zinc-600">({groupNotifications.length})</span>
              </h2>
              <div className="grid gap-2 sm:gap-3">
                {groupNotifications.map((notification) => (
                  <SwipableWrapper
                    enabled={selectionMode}
                    key={notification.id}
                    notification={notification}
                    onDelete={handleDelete}
                    onMarkAsRead={handleMarkAsRead}
                  >
                    <NotificationCard
                      autoMarkAsRead={!selectionMode && filter !== Filter.UNREAD}
                      notification={notification}
                      onDelete={handleDelete}
                      onMarkAsRead={handleMarkAsRead}
                      onSelect={toggleSelection}
                      selected={selectedIds.has(notification.id)}
                      selectionMode={selectionMode}
                    />
                  </SwipableWrapper>
                ))}
              </div>
            </div>
          ))}
          <div className="w-full py-4 flex justify-center" ref={loadMoreRef}>
            {isFetchingNextPage && <IconSpinner className="h-5 w-5 animate-spin text-zinc-600" />}
          </div>
        </div>
      )}
    </>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const content = getEmptyContent(filter)

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative">
        {content.icon}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-end/10 to-transparent rounded-full blur-3xl" />
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-2">{content.title}</h3>
      <p className="text-sm text-zinc-500 text-center max-w-xs">{content.description}</p>
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
      className="relative px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap
      aria-pressed:bg-brand-end aria-pressed:text-background aria-pressed:font-bold
      bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-zinc-200
      disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}

function getEmptyContent(filter: Filter) {
  switch (filter) {
    case Filter.BOOKMARK:
      return {
        icon: <IconBookmark className="mb-4 h-12 w-12 text-zinc-600/50" />,
        title: '북마크 알림이 없어요',
        description: '북마크한 만화의 새로운 업데이트가 있으면 알려드릴게요',
      }
    case Filter.NEW_MANGA:
      return {
        icon: <IconBook className="mb-4 h-12 w-12 text-zinc-600/50" />,
        title: '신규 만화 알림이 없어요',
        description: '새로운 만화가 추가되면 알려드릴게요',
      }
    case Filter.UNREAD:
      return {
        icon: <IconCheck className="mb-4 h-12 w-12 text-zinc-600/50" />,
        title: '모든 알림을 확인했어요',
        description: '새로운 알림이 도착하면 여기에 표시됩니다',
      }
    default:
      return {
        icon: <IconBell className="mb-4 h-12 w-12 text-zinc-600/50" />,
        title: '아직 알림이 없어요',
        description: '만화 업데이트와 새로운 소식을 알려드릴게요',
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
