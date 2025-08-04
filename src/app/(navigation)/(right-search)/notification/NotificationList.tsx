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
  read: number
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

  const [_, dispatchMarkAsRead] = useActionResponse({
    action: markAsRead,
    onError: (error) => {
      toast.error(error)
    },
    onSuccess: (data) => {
      toast.success(data)
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
    },
  })

  const [__, dispatchDeleteNotifications] = useActionResponse({
    action: deleteNotifications,
    onError: (error) => {
      toast.error(error)
    },
    onSuccess: (data) => {
      toast.success(data)
      setSelectedIds(new Set())
      setSelectionMode(false)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
    },
  })

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
      <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-background border-b-2 -mx-4 px-3 py-2 whitespace-nowrap sm:-mx-6 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hidden">
          <FilterButton active={filter === Filter.ALL} onClick={() => handleFilterChange(Filter.ALL)}>
            <span>전체</span>
          </FilterButton>
          <FilterButton active={filter === Filter.UNREAD} highlight onClick={() => handleFilterChange(Filter.UNREAD)}>
            <span>읽지 않음</span>
          </FilterButton>
          <FilterButton
            active={filter === Filter.BOOKMARK}
            icon={<IconBookmark className="w-4" />}
            onClick={() => handleFilterChange(Filter.BOOKMARK)}
          >
            <span className="hidden sm:inline">북마크</span>
          </FilterButton>
          <FilterButton
            active={filter === Filter.NEW_MANGA}
            icon={<IconBook className="w-4" />}
            onClick={() => handleFilterChange(Filter.NEW_MANGA)}
          >
            <span className="hidden sm:inline">신규</span>
          </FilterButton>
        </div>
        <div className="flex items-center gap-1.5">
          {selectionMode ? (
            <>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition"
                disabled={selectedIds.size === 0}
                onClick={() => handleBatchAction('read')}
                title="Mark as read"
              >
                <IconCheck className="w-4" />
                <span className="hidden sm:inline">읽음</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-900/20 rounded-md hover:bg-red-900/30 transition"
                disabled={selectedIds.size === 0}
                onClick={() => handleBatchAction('delete')}
                title="Delete"
              >
                <IconTrash className="w-4" />
                <span className="hidden sm:inline">삭제</span>
              </button>
              <button
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-300 transition"
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
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-300 transition"
              onClick={() => setSelectionMode(true)}
              title="Select multiple"
            >
              <IconFilter className="w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <IconSpinner className="w-10 text-zinc-600 animate-spin sm:w-12" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className={`space-y-6 py-4 transition-all duration-200 ${selectionMode ? 'scale-[0.99]' : 'scale-100'}`}>
          {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup}>
              <h2 className="mb-3 text-sm font-medium text-zinc-400 sticky top-0 bg-background py-1">
                {dateGroup}
                <span className="ml-2 text-xs text-zinc-600">({groupNotifications.length})</span>
              </h2>
              <div className="space-y-2">
                {groupNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onSelect={toggleSelection}
                    selected={selectedIds.has(notification.id)}
                    selectionMode={selectionMode}
                  />
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
  const getEmptyMessage = () => {
    switch (filter) {
      case Filter.BOOKMARK:
        return '북마크 관련 알림이 없어요'
      case Filter.NEW_MANGA:
        return '새 만화 알림이 없어요'
      case Filter.UNREAD:
        return '읽지 않은 알림이 없어요'
      default:
        return '알림이 없어요'
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <IconBell className="mb-4 h-10 w-10 text-zinc-600 sm:h-12 sm:w-12" />
      <p className="text-zinc-400">{getEmptyMessage()}</p>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  count,
  highlight = false,
  icon,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  highlight?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      aria-pressed={active}
      className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap bg-zinc-800/50
      aria-pressed:bg-brand-end aria-pressed:text-background aria-pressed:font-bold  hover:bg-zinc-800/50 hover:text-zinc-300"
      onClick={onClick}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span
          aria-selected={active}
          className={`ml-0.5 px-0.5 rounded-full text-[10px] font-bold min-w-[1.25rem] text-center
          aria-selected:bg-background/20 aria-selected:text-background
          ${highlight && count > 0 ? 'bg-brand-end text-background' : 'bg-zinc-700 text-zinc-400'}
        `}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
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
