'use client'

import { NotificationFilter } from '@litomi/domain/notification/filter'
import { Book, Check, Filter, Loader2, Trash2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'

import { SearchParams } from './common'
import { useNotificationSelection } from './NotificationProvider'
import useNotificationActions from './useNotificationActions'
import useNotificationInfiniteQuery from './useNotificationsInfiniteQuery'

export default function NotificationHeader() {
  const { data } = useNotificationInfiniteQuery()
  const { cancelSelection, selectedIds, selectionMode, startSelection } = useNotificationSelection()
  const t = useTranslations('Community.notification')
  const searchParams = useSearchParams()
  const router = useRouter()

  const { isActionPending, isDeleteNotificationsPending, isMarkAsReadPending, markNowAsRead, runBatchAction } =
    useNotificationActions()

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? []
  const filter = searchParams.get(SearchParams.FILTER) as NotificationFilter | null

  function setFilter(nextFilter: NotificationFilter | null) {
    router.replace(nextFilter === null ? '?' : `?filter=${nextFilter}`)
  }

  function markVisibleUnreadAsRead() {
    markNowAsRead(notifications.filter((notification) => !notification.read).map((notification) => notification.id))
  }

  return (
    <div className="sticky top-(--safe-area-top) min-h-(--safe-area-top) z-20 bg-background/95 backdrop-blur-sm border-b border-zinc-800 px-3 py-2 sm:px-4 sm:py-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hidden">
          <FilterButton active={!filter} disabled={isActionPending} onClick={() => setFilter(null)}>
            <span>{t('filters.all')}</span>
          </FilterButton>
          <FilterButton
            active={filter === NotificationFilter.UNREAD}
            disabled={isActionPending}
            onClick={() => setFilter(NotificationFilter.UNREAD)}
          >
            <span>{t('filters.unread')}</span>
          </FilterButton>
          <FilterButton
            active={filter === NotificationFilter.NEW_MANGA}
            disabled={isActionPending}
            onClick={() => setFilter(NotificationFilter.NEW_MANGA)}
          >
            <Book className="size-5 shrink-0" />
            <span className="hidden sm:inline">{t('filters.newManga')}</span>
          </FilterButton>
        </div>
        <div className="flex items-center gap-1.5">
          {filter === NotificationFilter.UNREAD && (
            <button
              className="px-2.5 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
              disabled={notifications.length === 0 || isActionPending}
              onClick={markVisibleUnreadAsRead}
            >
              {t('actions.markAllAsRead')}
            </button>
          )}
          {selectionMode ? (
            <>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition disabled:opacity-50"
                disabled={selectedIds.size === 0 || isActionPending}
                onClick={() => runBatchAction('read')}
                title={t('actions.markSelectedAsRead')}
              >
                {isMarkAsReadPending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                <span className="hidden sm:inline">{t('actions.markSelectedAsRead')}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-red-400 bg-red-900/20 rounded-md hover:bg-red-900/30 transition disabled:opacity-50"
                disabled={selectedIds.size === 0 || isActionPending}
                onClick={() => runBatchAction('delete')}
                title={t('actions.deleteSelected')}
              >
                {isDeleteNotificationsPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Trash2 className="size-5" />
                )}
                <span className="hidden sm:inline">{t('actions.deleteSelected')}</span>
              </button>
              <button
                className="px-2.5 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
                disabled={isActionPending}
                onClick={cancelSelection}
              >
                {t('actions.cancel')}
              </button>
            </>
          ) : (
            <button
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-300 transition disabled:opacity-50"
              disabled={notifications.length === 0 || isActionPending}
              onClick={startSelection}
              title={t('actions.selectionMode')}
            >
              <Filter className="size-5 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  disabled = false,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      aria-pressed={active}
      className={twMerge(
        'relative px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap',
        'aria-pressed:bg-brand aria-pressed:text-background aria-pressed:font-bold',
        'bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-zinc-200',
        'disabled:opacity-50',
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
