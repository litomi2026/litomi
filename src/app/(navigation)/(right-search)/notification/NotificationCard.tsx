'use client'

import Image from 'next/image'

import IconBell from '@/components/icons/IconBell'
import IconBook from '@/components/icons/IconBook'
import IconBookmark from '@/components/icons/IconBookmark'
import IconCheck from '@/components/icons/IconCheck'
import IconDot from '@/components/icons/IconDot'
import { NotificationType } from '@/database/enum'
import { formatDistanceToNow } from '@/utils/date'

interface NotificationCardProps {
  notification: {
    id: number
    type: number
    title: string
    body: string
    createdAt: string | Date
    read: number
    data: string | null
  }
  onSelect?: (id: number) => void
  selected?: boolean
  selectionMode?: boolean
}

export default function NotificationCard({
  notification,
  selected = false,
  onSelect,
  selectionMode = false,
}: NotificationCardProps) {
  const parsedData = notification.data ? JSON.parse(notification.data) : null
  const isUnread = notification.read === 0

  const getNotificationIcon = () => {
    switch (notification.type) {
      case NotificationType.BOOKMARK_UPDATE:
        return <IconBookmark className="w-5" />
      case NotificationType.NEW_MANGA:
        return <IconBook className="w-5" />
      default:
        return <IconBell className="w-5" />
    }
  }

  const getIconColor = () => {
    if (!isUnread) return 'text-zinc-500'

    switch (notification.type) {
      case NotificationType.BOOKMARK_UPDATE:
        return 'text-purple-400'
      case NotificationType.NEW_MANGA:
        return 'text-blue-400'
      default:
        return 'text-zinc-400'
    }
  }

  return (
    <div
      aria-selected={selected}
      className="group relative rounded-xl border transition-all duration-200 flex gap-3 p-3 sm:gap-4 sm:p-4 border-zinc-800 bg-zinc-900/30 
      hover:border-zinc-700 hover:bg-zinc-900/50 aria-selected:border-brand-end aria-selected:bg-brand-end/10"
      onClick={() => {
        if (selectionMode && onSelect) {
          onSelect(notification.id)
        }
      }}
    >
      {selectionMode && (
        <div className="flex items-center transition-all duration-200">
          <div
            aria-selected={selected}
            className="h-5 w-5 rounded-md border-2 transition-all aria-selected:border-brand-end aria-selected:bg-brand-end"
          >
            {selected && <IconCheck className="h-full w-full text-background" />}
          </div>
        </div>
      )}
      <div className={`mt-0.5 transition ${getIconColor()}`}>{getNotificationIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3
            className={`font-medium line-clamp-1 transition ${
              isUnread ? 'text-white' : 'text-zinc-300'
            } ${parsedData?.url ? 'group-hover:text-brand-end' : ''}`}
          >
            {notification.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isUnread && <IconDot className="h-2 w-2 text-brand-end animate-pulse" />}
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(
                typeof notification.createdAt === 'string' ? new Date(notification.createdAt) : notification.createdAt,
              )}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{notification.body}</p>
        {parsedData?.mangaId && parsedData?.thumbnail && (
          <div className="mt-3 flex items-center gap-3">
            <Image
              alt="Manga preview"
              className="rounded-md object-cover"
              height={64}
              src={parsedData.thumbnail}
              width={48}
            />
            <div className="text-xs text-zinc-500">
              {parsedData.mangaTitle && (
                <p className="font-medium text-zinc-400 line-clamp-1">{parsedData.mangaTitle}</p>
              )}
              {parsedData.chapter && <p>Chapter {parsedData.chapter}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
