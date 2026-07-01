'use client'

import type { ChatMessageDTO } from '@litomi/contracts'
import { MessageCircle, Users } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { avatarUrl, mergeById, textOf, toChatMessageDTO } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useSendMessageMutation from '../_query/useSendMessageMutation'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import { useChat } from './ChatProvider'
import ComposerDock from './ComposerDock'

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
  const listRef = useRef<ChatMessageListHandle>(null)
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
      listRef.current?.scrollToBottom()
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

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center px-4 border-b border-foreground/10 bg-background/80">
        <div className="p-2 text-indigo-500 bg-indigo-500/10 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-lg text-foreground ml-2">전체 메시지 (Broadcast)</h2>
      </div>

      {/* Live fan-reply ticker (sampled: newest few across all messages) */}
      {liveReplies.length > 0 && (
        <div className="shrink-0 border-b border-foreground/10 bg-foreground/5 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400">실시간 팬 반응</span>
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5">
            {liveReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => router.push(`/sobok/studio/${handle}/message/${reply.targetMessageId}`)}
                className="flex items-center gap-1.5 shrink-0 max-w-60 bg-zinc-800 rounded-full pl-1 pr-3 py-1 hover:bg-zinc-700 transition-colors"
              >
                <img
                  src={avatarUrl(reply.nickname, reply.imageURL)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="text-xs font-semibold text-zinc-300 shrink-0">{reply.nickname}</span>
                <span className="text-xs text-zinc-400 truncate">{reply.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message feed */}
      <ChatMessageList
        banner={
          <div className="text-center my-2">
            <span className="bg-foreground/10 text-zinc-400 text-xs px-3 py-1.5 rounded-full font-medium">
              여기서 보내는 메시지는 모든 팬에게 전송됩니다.
            </span>
          </div>
        }
        bottomInsetClassName="pb-[var(--sobok-dock-h)]"
        gapClassName="pb-3"
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(row) => row.message.messageId}
        items={messages}
        onLoadOlder={fetchNextPage}
        ref={listRef}
        renderItem={(row) => (
          <div className="flex justify-end w-full">
            <div className="flex flex-col items-end gap-1 max-w-[80%]">
              <div className="flex items-end gap-1.5 flex-row-reverse">
                <div className="px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-indigo-500 text-white">
                  {textOf(row.message.content)}
                </div>
                <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                  {new Date(row.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <Link
                href={`/sobok/studio/${handle}/message/${row.message.messageId}`}
                className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                답장방
                {row.unreadReplyCount > 0
                  ? ` · ${row.unreadReplyCount > 999 ? '999+' : row.unreadReplyCount} 새 답장`
                  : ''}
              </Link>
            </div>
          </div>
        )}
        scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
      />

      {/* Composer island */}
      <ComposerDock>
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder="팬들에게 보낼 메시지를 입력하세요..."
          disabled={isPending}
        />
      </ComposerDock>
    </div>
  )
}
