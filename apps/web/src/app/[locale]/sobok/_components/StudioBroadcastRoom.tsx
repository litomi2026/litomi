'use client'

import type { ChatMessageDTO } from '@litomi/contracts'
import { MessageCircle, Users } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { avatarUrl, mergeById, textOf, toChatMessageDTO } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useSendMessageMutation from '../_query/useSendMessageMutation'
import ChatComposer from './ChatComposer'
import { useChat } from './ChatProvider'

// Rolling window of the most recent fan replies shown in the live ticker. This IS the
// client-side sampling: under a burst the artist only ever sees the latest few, not a
// firehose (server-side rate sampling on c:{artistId} is a scale-time follow-up).
const TICKER_SIZE = 6

interface MessageRow {
  message: ChatMessageDTO
  unreadReplyCount: number
}

interface LiveReply {
  id: string
  targetMessageId: string
  nickname: string
  imageURL: string | null
  text: string
}

export default function StudioBroadcastRoom({ handle }: { handle: string }) {
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageDTO[]>([])
  const [liveReplies, setLiveReplies] = useState<LiveReply[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { subscribeRoom, unsubscribeRoom, onMessage } = useChat()
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const { mutateAsync: sendMessage, isPending } = useSendMessageMutation(handle)
  const router = useRouter()

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle, {
    refetchInterval: ms('20 seconds'),
  })

  const fetchedRows: MessageRow[] = (data?.pages.flatMap((page) => page.messages) ?? []).map((item) => ({
    message: item.message,
    unreadReplyCount: item.unreadReplyCount ?? 0,
  }))

  const realtimeRows: MessageRow[] = realtimeMessages.map((message) => ({ message, unreadReplyCount: 0 }))
  const messages = mergeById(fetchedRows, realtimeRows, (row) => row.message.messageId)
  const artist = artistData?.artist
  const isOwner = artistData?.isOwner

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isPending) {
      return
    }

    try {
      const { messageId } = await sendMessage({ contentType: 'text', text })

      const newMessage: ChatMessageDTO = {
        messageId,
        senderId: artist?.id ?? 0,
        contentType: 'text',
        content: { text },
        createdAt: new Date().toISOString(),
      }

      setRealtimeMessages((prev) => (prev.some((b) => b.messageId === messageId) ? prev : [...prev, newMessage]))
      setInput('')
    } catch {
      // Keep the text so the artist can retry.
    }
  }

  // Non-owners don't belong in the studio.
  useEffect(() => {
    if (artistData && !isOwner) {
      router.replace(`/sobok/${handle}`)
    }
  }, [artistData, isOwner, handle, router])

  // Own broadcasts (b:) + the fan-in reply firehose (c:, owner-only).
  useEffect(() => {
    if (!artist || !isOwner) {
      return
    }

    const broadcastRoom = `b:${artist.id}`
    const inboundRoom = `c:${artist.id}`
    subscribeRoom(broadcastRoom)
    subscribeRoom(inboundRoom)

    return () => {
      unsubscribeRoom(broadcastRoom)
      unsubscribeRoom(inboundRoom)
    }
  }, [artist, isOwner, subscribeRoom, unsubscribeRoom])

  useEffect(() => {
    if (!artist || !isOwner) {
      return
    }

    const broadcastRoom = `b:${artist.id}`
    const inboundRoom = `c:${artist.id}`

    return onMessage((msgRoom, msg) => {
      if (msgRoom === broadcastRoom && msg.kind === 'broadcast') {
        setRealtimeMessages((prev) =>
          prev.some((b) => b.messageId === msg.messageId) ? prev : [...prev, toChatMessageDTO(msg)],
        )
        return
      }

      if (msgRoom === inboundRoom && msg.kind === 'reply') {
        const newReply: LiveReply = {
          id: msg.messageId,
          targetMessageId: msg.targetMessageId,
          nickname: msg.sender?.nickname ?? '팬',
          imageURL: msg.sender?.imageURL ?? null,
          text: textOf(msg.content),
        }

        setLiveReplies((prev) =>
          [newReply, ...prev.filter((reply) => reply.id !== msg.messageId)].slice(0, TICKER_SIZE),
        )
      }
    })
  }, [artist, isOwner, onMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-indigo-50/30 dark:bg-[#0a0a0c]">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-indigo-50/30 dark:bg-[#0a0a0c]">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center px-4 border-b border-gray-200/40 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80">
        <div className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">전체 메시지 (Broadcast)</h2>
      </div>

      {/* Live fan-reply ticker (sampled: newest few across all messages) */}
      {liveReplies.length > 0 && (
        <div className="shrink-0 border-b border-gray-200/40 dark:border-white/5 bg-white/60 dark:bg-white/2 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">실시간 팬 반응</span>
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5">
            {liveReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => router.push(`/sobok/studio/${handle}/message/${reply.targetMessageId}`)}
                className="flex items-center gap-1.5 shrink-0 max-w-[200px] bg-gray-100/80 dark:bg-white/5 rounded-full pl-1 pr-3 py-1 hover:bg-gray-200/70 dark:hover:bg-white/10 transition-colors"
              >
                <img
                  src={avatarUrl(reply.nickname, reply.imageURL)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                  {reply.nickname}
                </span>
                <span className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{reply.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message feed */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3 custom-scrollbar flex flex-col"
      >
        {isFetchingNextPage && <div className="text-center text-xs text-gray-400 py-2">불러오는 중...</div>}

        <div className="text-center my-2">
          <span className="bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-xs px-3 py-1.5 rounded-full font-medium">
            여기서 보내는 메시지는 모든 팬에게 전송됩니다.
          </span>
        </div>

        {messages.map((row) => {
          const unread = row.unreadReplyCount
          return (
            <div key={row.message.messageId} className="flex justify-end w-full">
              <div className="flex flex-col items-end gap-1 max-w-[80%]">
                <div className="flex items-end gap-1.5 flex-row-reverse">
                  <div className="px-3.5 py-2 rounded-2xl rounded-br-[4px] shadow-sm text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap bg-indigo-500 text-white">
                    {textOf(row.message.content)}
                  </div>
                  <span className="text-[10px] text-gray-400 mb-0.5 shrink-0 font-medium">
                    {new Date(row.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Link
                  href={`/sobok/studio/${handle}/message/${row.message.messageId}`}
                  className="flex items-center gap-1 text-[12px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  답장방{unread > 0 ? ` · ${unread > 999 ? '999+' : unread} 새 답장` : ''}
                </Link>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/5 p-2.5 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={() => void handleSend()}
          placeholder="팬들에게 보낼 메시지를 입력하세요..."
          disabled={isPending}
        />
      </div>
    </div>
  )
}
