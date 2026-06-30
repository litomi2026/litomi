'use client'

import type { ChatMessageContent, ChatMessageDTO, ChatRelayMessageDTO } from '@litomi/contracts'
import { Image as ImageIcon, MessageCircle, Send, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useSendMessageMutation from '../_query/useSendMessageMutation'
import { useChat } from './ChatProvider'

interface MessageRow {
  message: ChatMessageDTO
  unreadReplyCount: number
}

function messageToMessage(msg: ChatRelayMessageDTO): ChatMessageDTO {
  return {
    messageId: msg.messageId,
    senderId: msg.senderId,
    contentType: msg.contentType,
    content: msg.content,
    createdAt: msg.createdAt,
  }
}

function messageIdOfReply(streamId: string): string | null {
  // rb:{artistId}:{messageId}
  const parts = streamId.split(':')
  return parts[0] === 'rb' && parts.length === 3 ? parts[2] : null
}

function textOf(content: ChatMessageContent): string {
  return 'text' in content && typeof content.text === 'string' ? content.text : '미디어'
}

export default function StudioBroadcastRoom({ handle }: { handle: string }) {
  const router = useRouter()
  const { subscribeRoom, unsubscribeRoom, onMessage } = useChat()

  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle)
  const { mutateAsync: sendMessage, isPending } = useSendMessageMutation(handle)

  const [input, setInput] = useState('')
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageDTO[]>([])
  // Replies arriving live since the last server fetch, counted per message.
  const [liveUnread, setLiveUnread] = useState<Record<string, number>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Non-owners don't belong in the studio.
  useEffect(() => {
    if (artistData && !isOwner) {
      router.replace(`/sobok/${handle}`)
    }
  }, [artistData, isOwner, handle, router])

  // A full refetch produces a new newest page that already includes those replies, so
  // drop the live deltas then. fetchNextPage (older pages) keeps page[0] identity → no reset.
  const newestPage = data?.pages[0]
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset live deltas only when the newest page is refetched
  useEffect(() => {
    setLiveUnread({})
  }, [newestPage])

  // Own broadcasts (b:) + the fan-in reply firehose (c:, owner-only).
  useEffect(() => {
    if (!artist || !isOwner) {
      return
    }

    const broadcastRoom = `b:${artist.id}`
    const inboundRoom = `c:${artist.id}`
    subscribeRoom(broadcastRoom)
    subscribeRoom(inboundRoom)

    const off = onMessage((msgRoom, msg) => {
      if (msgRoom === broadcastRoom && msg.kind === 'broadcast') {
        setRealtimeMessages((prev) =>
          prev.some((b) => b.messageId === msg.messageId) ? prev : [...prev, messageToMessage(msg)],
        )
      } else if (msgRoom === inboundRoom && msg.kind === 'reply') {
        const messageId = messageIdOfReply(msg.streamId)
        if (messageId) {
          setLiveUnread((prev) => ({ ...prev, [messageId]: (prev[messageId] ?? 0) + 1 }))
        }
      }
    })

    return () => {
      off()
      unsubscribeRoom(broadcastRoom)
      unsubscribeRoom(inboundRoom)
    }
  }, [artist, isOwner, onMessage, subscribeRoom, unsubscribeRoom])

  const messages = useMemo<MessageRow[]>(() => {
    const byId = new Map<string, MessageRow>()

    for (const item of data?.pages.flatMap((page) => page.messages) ?? []) {
      byId.set(item.message.messageId, { message: item.message, unreadReplyCount: item.unreadReplyCount ?? 0 })
    }

    for (const message of realtimeMessages) {
      if (!byId.has(message.messageId)) {
        byId.set(message.messageId, { message, unreadReplyCount: 0 })
      }
    }

    return [...byId.values()].sort((a, b) => a.message.messageId.localeCompare(b.message.messageId))
  }, [data, realtimeMessages])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to newest only when the count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isPending) {
      return
    }

    try {
      const { messageId } = await sendMessage({ contentType: 'text', text })
      setRealtimeMessages((prev) =>
        prev.some((b) => b.messageId === messageId)
          ? prev
          : [
              ...prev,
              {
                messageId,
                senderId: artist?.id ?? 0,
                contentType: 'text',
                content: { text },
                createdAt: new Date().toISOString(),
              },
            ],
      )
      setInput('')
    } catch {
      // Keep the text so the artist can retry.
    }
  }, [input, isPending, sendMessage, handle, artist])

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-indigo-50/30 dark:bg-[#0a0a0c]">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-indigo-50/30 dark:bg-[#0a0a0c] relative">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200/40 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl absolute top-0 w-full z-10">
        <div className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">전체 메시지 (Broadcast)</h2>
      </div>

      {/* Message feed */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-[72px] pb-6 space-y-3 custom-scrollbar flex flex-col"
      >
        {isFetchingNextPage && <div className="text-center text-xs text-gray-400 py-2">불러오는 중...</div>}

        <div className="text-center my-2">
          <span className="bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-xs px-3 py-1.5 rounded-full font-medium">
            여기서 보내는 메시지는 모든 팬에게 전송됩니다.
          </span>
        </div>

        {messages.map((row) => {
          const unread = row.unreadReplyCount + (liveUnread[row.message.messageId] ?? 0)
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
      <div className="bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/5 p-2.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] z-10">
        <div className="flex items-end gap-2 bg-gray-100/60 dark:bg-white/5 rounded-3xl p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
          <button className="p-2 text-gray-400 hover:text-indigo-500 transition-colors shrink-0" type="button">
            <ImageIcon className="w-[22px] h-[22px]" />
          </button>
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="팬들에게 보낼 메시지를 입력하세요..."
            className="flex-1 bg-transparent border-none py-[10px] px-1 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none max-h-28"
            maxRows={4}
            disabled={isPending}
          />
          <button
            className="p-[9px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:dark:bg-indigo-900 text-white rounded-full transition-all shrink-0 shadow-sm"
            disabled={!input.trim() || isPending}
            onClick={() => void handleSend()}
            type="button"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
