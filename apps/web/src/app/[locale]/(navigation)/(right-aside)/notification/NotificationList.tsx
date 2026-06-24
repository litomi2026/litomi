'use client'

import { NotificationFilter } from '@litomi/domain/notification/filter'
import { Book, Check, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

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

type NotificationDateGroup = 'older' | 'thisWeek' | 'today' | 'yesterday'

export default function NotificationList() {
  const { deleteNotification, isActionPending, markNowAsRead } = useNotificationActions()
  const { selectedIds, selectionMode, toggleSelection } = useNotificationSelection()
  const t = useTranslations('Community.notification')
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()

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
    return <AdultVerificationGate description={t('adultGate.description')} />
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
      {groupedNotifications.map(({ key, notifications: groupNotifications }) => (
        <div key={key}>
          <h2 className="mb-3 text-sm font-medium text-zinc-400 bg-background py-1">
            {t(`groups.${key}`)}
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
  const searchParams = useSearchParams()
  const filter = searchParams.get(SearchParams.FILTER) as NotificationFilter | null
  const t = useTranslations('Community.notification')
  const content = getEmptyContent(filter, t)
  const showKeywordSetting = content.showKeywordSetting

  return (
    <StatusState description={content.description} icon={content.icon} title={content.title}>
      {showKeywordSetting && (
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <StatusActionLink className="max-w-none" href="/settings#push">
            {t('empty.enablePush')}
          </StatusActionLink>
          <StatusActionLink className="max-w-none" href="/settings#keyword" variant="secondary">
            {t('empty.keywordSettings')}
          </StatusActionLink>
        </div>
      )}
    </StatusState>
  )
}

function getEmptyContent(
  filter: NotificationFilter | null,
  t: ReturnType<typeof useTranslations<'Community.notification'>>,
) {
  switch (filter) {
    case NotificationFilter.NEW_MANGA:
      return {
        icon: <Book className="size-8" />,
        title: t('empty.newMangaTitle'),
        description: t('empty.newMangaDescription'),
      }
    case NotificationFilter.UNREAD:
      return {
        icon: <Check className="size-8" />,
        title: t('empty.unreadTitle'),
        description: t('empty.unreadDescription'),
      }
    default:
      return {
        icon: <IconBell className="size-8" />,
        title: t('empty.defaultTitle'),
        description: (
          <>
            {t('empty.defaultDescription')}
            <br />
            <span className="text-xs text-zinc-500">{t('empty.retentionNotice')}</span>
          </>
        ),
        showKeywordSetting: true,
      }
  }
}

const NOTIFICATION_DATE_GROUPS: NotificationDateGroup[] = ['today', 'yesterday', 'thisWeek', 'older']

function groupNotificationsByDate(notifications: Notification[]) {
  const groups: Partial<Record<NotificationDateGroup, Notification[]>> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  for (const notification of notifications) {
    const date = typeof notification.createdAt === 'string' ? new Date(notification.createdAt) : notification.createdAt
    let groupKey: NotificationDateGroup

    if (date >= today) {
      groupKey = 'today'
    } else if (date >= yesterday) {
      groupKey = 'yesterday'
    } else if (date >= weekAgo) {
      groupKey = 'thisWeek'
    } else {
      groupKey = 'older'
    }

    const groupNotifications = groups[groupKey] ?? []
    groupNotifications.push(notification)
    groups[groupKey] = groupNotifications
  }

  return NOTIFICATION_DATE_GROUPS.flatMap((key) => {
    const notifications = groups[key]
    return notifications ? [{ key, notifications }] : []
  })
}

function NotificationLoading() {
  const t = useTranslations('Community.notification')

  return (
    <div className="flex-1 flex items-center justify-center animate-fade-in [animation-delay:0.3s] [animation-fill-mode:both]">
      <Loader2 aria-label={t('loading')} className="size-10 shrink-0 text-zinc-600 animate-spin sm:size-12" />
    </div>
  )
}
