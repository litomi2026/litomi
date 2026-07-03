'use client'

import type { GETV1ChatThreadsResponse } from '@litomi/contracts'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { avatarURL } from '../_lib/chat'
import useChatThreadsQuery from '../_query/useChatThreadsQuery'

type ChatThread = GETV1ChatThreadsResponse['threads'][number]

function ChatThreadItem({ thread }: { thread: ChatThread }) {
  const { artist, lastMessage, unreadCount } = thread
  const createdAt = lastMessage?.createdAt

  return (
    <Link
      href={`/sobok/${artist.handle}`}
      className="flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-[0.98] active:bg-foreground/5"
    >
      <div className="relative shrink-0">
        <img
          src={avatarURL(artist.displayName, artist.imageURL)}
          alt={artist.displayName}
          className="w-14 h-14 rounded-full object-cover shadow-sm ring-1 ring-foreground/10"
        />
      </div>
      <div className="flex-1 min-w-0 border-b border-foreground/10 pb-3 pt-1">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-base truncate text-foreground">
            {artist.emoji && <span className="mr-1.5">{artist.emoji}</span>}
            {artist.displayName}
          </h3>
          <span className="text-xs font-medium text-zinc-400 shrink-0">
            {createdAt &&
              new Date(createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm text-zinc-400 truncate flex-1">
            {lastMessage?.preview || '새로운 메시지를 기다리고 있어요'}
          </p>
          {unreadCount > 0 && (
            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function ChatThreadList() {
  const { data, isLoading } = useChatThreadsQuery()
  const threads = data?.threads

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-zinc-400">Loading chats...</div>
  }

  if (!threads || threads.length === 0) {
    return <div className="p-4 text-center text-sm text-zinc-400">No active chats</div>
  }

  return (
    <>
      {threads.map((thread) => (
        <ChatThreadItem key={thread.artist.id} thread={thread} />
      ))}
    </>
  )
}

export default function ChatList() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 sticky top-0 bg-background/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Chats</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/sobok/billing"
              className="text-xs font-semibold text-zinc-400 hover:text-foreground transition-colors"
            >
              결제 관리
            </Link>
            <Link
              href="/sobok/studio"
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              스튜디오
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search artist..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-base placeholder:text-zinc-400 text-foreground"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar">
        <ChatThreadList />
      </div>
    </div>
  )
}
