'use client'

import { Bell, Book, Bookmark, Check, Circle, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import LinkPending from '@/components/LinkPending'
import { NotificationType } from '@/database/enum'
import { NotificationData } from '@/database/type'
import { formatDistanceToNow } from '@/utils/format/date'

const AUTO_MARK_AS_READ_DELAY = 2000

interface NotificationCardProps {
  autoMarkAsRead: boolean
  notification: {
    id: number
    type: number
    title: string
    body: string
    createdAt: string | Date
    read: boolean
    data: string | null
  }
  onDelete: (id: number) => void
  onMarkAsRead: (id: number) => void
  onSelect: (id: number) => void
  selected: boolean
  selectionMode: boolean
}

export default function NotificationCard({
  autoMarkAsRead = true,
  notification,
  onDelete,
  onMarkAsRead,
  onSelect,
  selected = false,
  selectionMode = false,
}: NotificationCardProps) {
  const parsedData = useMemo(
    () => (notification.data ? (JSON.parse(notification.data) as NotificationData) : null),
    [notification.data],
  )

  const mangaViewerURL = parsedData?.url
  const isUnread = !notification.read
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const skipAutoMarkingAsRead = !autoMarkAsRead || notification.read || hasBeenViewed

  const { ref: cardRef, inView } = useInView({
    threshold: 0.7,
    skip: skipAutoMarkingAsRead,
  })

  function getNotificationIcon() {
    switch (notification.type) {
      case NotificationType.BOOKMARK_UPDATE:
        return <Bookmark className="w-5" />
      case NotificationType.NEW_MANGA:
        return <Book className="w-5" />
      case NotificationType.TEST:
        return <Bell className="w-5" />
      default:
        return <Bell className="w-5" />
    }
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (selectionMode) {
      e.preventDefault()
      onSelect?.(notification.id)
      return
    }

    if (!mangaViewerURL) {
      e.preventDefault()
      return
    }
  }

  // NOTE: 자동 읽음 표시 기능
  useEffect(() => {
    if (skipAutoMarkingAsRead) {
      return
    }

    if (inView) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      timerRef.current = setTimeout(() => {
        if (!notification.read && onMarkAsRead) {
          onMarkAsRead(notification.id)
          setHasBeenViewed(true)
        }
        timerRef.current = null
      }, AUTO_MARK_AS_READ_DELAY)
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [inView, notification.id, notification.read, onMarkAsRead, skipAutoMarkingAsRead])

  return (
    <Link
      aria-selected={selected}
      className={`group relative rounded-xl border transition flex gap-3 p-3 sm:gap-4 sm:p-4 overflow-hidden
      ${isUnread ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900/20'}
      hover:border-zinc-600 hover:bg-zinc-900/60 aria-selected:border-brand aria-selected:bg-brand/10
      ${mangaViewerURL && !selectionMode ? 'cursor-pointer' : ''}`}
      href={mangaViewerURL ?? ''}
      onClick={handleClick}
      prefetch={false}
      ref={cardRef}
    >
      {selectionMode ? (
        <div className="flex items-center transition">
          <div
            aria-selected={selected}
            className="size-5 rounded-md border-2 transition aria-selected:border-brand aria-selected:bg-brand"
          >
            {selected && <Check className="size-full text-background" />}
          </div>
        </div>
      ) : (
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {isUnread && onMarkAsRead && (
            <button
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition"
              onClick={(e) => {
                e.preventDefault()
                onMarkAsRead(notification.id)
              }}
              title="읽음 표시"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
          {onDelete && (
            <button
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-900 hover:text-red-400 transition"
              onClick={(e) => {
                e.preventDefault()
                onDelete(notification.id)
              }}
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>
      )}
      <div aria-current={isUnread} className="mt-0.5 transition text-zinc-500 aria-current:text-brand">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3
            className={`font-medium line-clamp-1 transition ${
              isUnread ? 'text-foreground' : 'text-zinc-300'
            } ${mangaViewerURL ? 'group-hover:text-brand' : ''}`}
          >
            {notification.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {isUnread && <Circle className="h-2 w-2 text-brand animate-pulse" fill="currentColor" stroke="none" />}
            <span className="text-xs text-zinc-500">{formatDistanceToNow(new Date(notification.createdAt))}</span>
          </div>
        </div>
        <div className="flex justify-between gap-2 mt-1">
          <div>
            <p className="font-medium text-sm text-zinc-400 line-clamp-2">{notification.body}</p>
            {parsedData && parsedData.artists && parsedData.artists.length > 0 && (
              <p className="text-xs text-zinc-400 line-clamp-1 mt-1">작가: {parsedData.artists.join(', ')}</p>
            )}
          </div>
          {parsedData && parsedData.mangaId && parsedData.previewImageURL && (
            <img
              alt={parsedData.mangaId.toString()}
              className="rounded-md object-cover aspect-3/4"
              height={64}
              src={parsedData.previewImageURL}
              width={48}
            />
          )}
        </div>
      </div>
      <LinkPending
        className="size-5"
        wrapperClassName="flex items-center justify-center absolute inset-0 bg-background/50 animate-fade-in-fast"
      />
    </Link>
  )
}
