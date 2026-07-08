'use client'

import type { GETV1ChatThreadsResponse } from '@litomi/contracts'
import { sobokRoomPath } from '@litomi/domain/chat/routes'
import { Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { formatTime } from '../_lib/format'
import useChatThreadsQuery from '../_query/useChatThreadsQuery'
import Avatar from './ui/Avatar'
import Skeleton from './ui/Skeleton'

type ChatThread = GETV1ChatThreadsResponse['threads'][number]

function ChatThreadItem({ thread, active }: { thread: ChatThread; active: boolean }) {
  const t = useTranslations('Sobok.chatList')
  const locale = useLocale()

  const { artist, lastMessage, unreadCount } = thread
  const createdAt = lastMessage?.createdAt

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      href={sobokRoomPath(artist.handle)}
      className="flex items-center gap-4 rounded-2xl p-3 transition-all active:scale-[0.98] active:bg-foreground/5 aria-[current=page]:bg-foreground/5"
    >
      <Avatar className="h-14 w-14 shadow-sm" imageURL={artist.imageURL} name={artist.displayName} />
      <div className="min-w-0 flex-1 border-b border-foreground/10 pb-3 pt-1">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="truncate text-base font-semibold text-foreground">
            {artist.emoji && <span className="mr-1.5">{artist.emoji}</span>}
            {artist.displayName}
          </h3>
          <span className="shrink-0 text-xs font-medium text-zinc-400">
            {createdAt && formatTime(createdAt, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="flex-1 truncate text-sm text-zinc-400">{lastMessage?.preview || t('waitingForMessage')}</p>
          {unreadCount > 0 && (
            <div className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-xs font-bold text-white shadow-sm">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function ThreadListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="flex items-center gap-4 p-3" key={index}>
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2 pb-3 pt-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-44 max-w-full" />
          </div>
        </div>
      ))}
    </>
  )
}

// The thread list body (search + rows). The surrounding chrome (page title, sidebar frame)
// belongs to the caller — this renders in both the mobile home screen and the desktop sidebar.
export default function ThreadList() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useChatThreadsQuery()
  const t = useTranslations('Sobok.chatList')
  const pathname = usePathname()

  const activeHandle = decodeURIComponent(pathname).match(/^\/sobok\/@([^/]+)/)?.[1]
  const query = search.trim().toLocaleLowerCase()

  const threads = (data?.threads ?? []).filter(
    (thread) =>
      !query ||
      thread.artist.displayName.toLocaleLowerCase().includes(query) ||
      thread.artist.handle.toLocaleLowerCase().includes(query),
  )

  function renderThreads() {
    if (isLoading) {
      return <ThreadListSkeleton />
    }

    if (threads.length === 0) {
      return <p className="p-4 text-center text-sm text-zinc-400">{query ? t('searchNoResults') : t('empty')}</p>
    }

    return threads.map((thread) => (
      <ChatThreadItem active={thread.artist.handle === activeHandle} key={thread.artist.id} thread={thread} />
    ))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-2xl border-none bg-zinc-800 py-2.5 pl-10 pr-4 text-base text-foreground outline-none transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">{renderThreads()}</div>
    </div>
  )
}
