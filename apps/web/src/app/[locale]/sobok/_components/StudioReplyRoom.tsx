'use client'

import type { ChatReplyWithFan } from '@litomi/contracts'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { avatarUrl, mergeById, textOf } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useMarkMessageReadMutation from '../_query/useMarkMessageReadMutation'
import useMessageReplyQuery from '../_query/useMessageReplyQuery'
import { useChat } from './ChatProvider'

export default function StudioReplyRoom({ handle, messageId }: { handle: string; messageId: string }) {
  const [liveReplies, setLiveReplies] = useState<ChatReplyWithFan[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { subscribeRoom, unsubscribeRoom, onMessage } = useChat()
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessageReplyQuery(handle, messageId)
  const { mutate: markMessageRead } = useMarkMessageReadMutation(handle, messageId)
  const router = useRouter()

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner
  const fetchedReplies = data?.pages.flatMap((page) => page.replies) ?? []
  const replies = mergeById(fetchedReplies, liveReplies, (reply) => reply.messageId)
  const newestReplyId = replies.at(-1)?.messageId ?? null

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  useEffect(() => {
    if (artistData && !isOwner) {
      router.replace(`/sobok/${handle}`)
    }
  }, [artistData, isOwner, handle, router])

  useEffect(() => {
    if (!artist || !isOwner) {
      return
    }

    const inboundRoom = `c:${artist.id}`
    subscribeRoom(inboundRoom)

    return () => {
      unsubscribeRoom(inboundRoom)
    }
  }, [artist, isOwner, subscribeRoom, unsubscribeRoom])

  useEffect(() => {
    if (!artist || !isOwner) {
      return
    }

    const inboundRoom = `c:${artist.id}`

    return onMessage((msgRoom, msg) => {
      if (msgRoom !== inboundRoom || msg.kind !== 'reply' || msg.targetMessageId !== messageId) {
        return
      }

      const newReply: ChatReplyWithFan = {
        messageId: msg.messageId,
        targetMessageId: messageId,
        senderId: msg.senderId,
        contentType: msg.contentType,
        content: msg.content,
        createdAt: msg.createdAt,
        fan: null,
      }

      setLiveReplies((prev) => (prev.some((r) => r.messageId === msg.messageId) ? prev : [...prev, newReply]))
    })
  }, [artist, isOwner, messageId, onMessage])

  // Mark the room read up to the newest reply → fans see "read" on their reply.
  useEffect(() => {
    if (newestReplyId) {
      markMessageRead({ lastReadMessageId: newestReplyId })
    }
  }, [newestReplyId, handle, messageId, markMessageRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href={`/sobok/studio/${handle}`} className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">메시지 답장</h2>
      </div>

      {/* Replies (all fans; the artist reads the whole room) */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 custom-scrollbar flex flex-col"
      >
        {isFetchingNextPage && <div className="text-center text-xs text-zinc-400 py-2">불러오는 중...</div>}

        {replies.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">아직 답장이 없어요.</div>
        )}

        {replies.map((reply) => {
          const fanName = reply.fan?.nickname || `팬 #${reply.senderId}`
          return (
            <div key={reply.messageId} className="flex justify-start w-full">
              <div className="flex max-w-[80%] flex-row items-end gap-2">
                <img
                  src={avatarUrl(fanName, reply.fan?.imageURL)}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
                />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-zinc-400 mb-1 ml-1 font-medium tracking-tight">{fanName}</span>
                  <div className="flex items-end gap-1.5">
                    <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border border-foreground/10">
                      {textOf(reply.content)}
                    </div>
                    <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
