'use client'

import type { ChatMessageContent, ChatMessageDTO, ChatRelayMessageDTO, ChatReplyDTO } from '@litomi/contracts'
import { Check, CheckCheck, ChevronLeft, Image as ImageIcon, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import { useChat } from './ChatProvider'

interface TimelineEntry {
  message: ChatMessageDTO
  myReplies: ChatReplyDTO[]
  artistRead: boolean
}

// The fan's room is a single time-ordered stream: artist messages and the fan's own
// replies interleaved strictly by messageId (ULID = chronological), so a reply to an
// older message still appears at the bottom when it was sent — never back up the list.
type FlatItem =
  | { id: string; kind: 'message'; message: ChatMessageDTO }
  | { id: string; kind: 'reply'; reply: ChatReplyDTO; read: boolean }

function messageToMessage(msg: ChatRelayMessageDTO): ChatMessageDTO {
  return {
    messageId: msg.messageId,
    senderId: msg.senderId,
    contentType: msg.contentType,
    content: msg.content,
    createdAt: msg.createdAt,
  }
}

function textOf(content: ChatMessageContent): string {
  return 'text' in content && typeof content.text === 'string' ? content.text : '미디어'
}

export default function ChatRoom({ handle }: { handle: string }) {
  const [optimisticReplies, setOptimisticReplies] = useState<Record<string, ChatReplyDTO[]>>({})
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageDTO[]>([])
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { myUserId, subscribeRoom, unsubscribeRoom, onMessage } = useChat()
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isError } = useChatMessageQuery(handle)
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const { mutateAsync: sendReply, isPending } = useSendReplyMutation(handle)
  const { mutate: markRead } = useMarkReadMutation(handle)
  const router = useRouter()

  const artist = artistData?.artist
  const entitled = artistData?.entitled
  const isOwner = artistData?.isOwner
  const timeline = getTimeline()
  const flatItems = getFlatItems()
  const latestMessageId = timeline.at(-1)?.message.messageId ?? null
  const effectiveTargetId = replyTargetId ?? latestMessageId
  const replyingToOlder = replyTargetId !== null && replyTargetId !== latestMessageId

  function getTimeline(): TimelineEntry[] {
    const byId = new Map<string, TimelineEntry>()

    for (const item of data?.pages.flatMap((page) => page.messages) ?? []) {
      byId.set(item.message.messageId, {
        message: item.message,
        myReplies: [...(item.myReplies ?? [])],
        artistRead: item.artistReadMyReplies ?? false,
      })
    }

    for (const message of realtimeMessages) {
      if (!byId.has(message.messageId)) {
        byId.set(message.messageId, { message, myReplies: [], artistRead: false })
      }
    }

    for (const [messageId, replies] of Object.entries(optimisticReplies)) {
      const entry = byId.get(messageId)
      if (!entry) {
        continue
      }
      const seen = new Set(entry.myReplies.map((r) => r.messageId))
      for (const reply of replies) {
        if (!seen.has(reply.messageId)) {
          entry.myReplies.push(reply)
        }
      }
    }

    const entries = [...byId.values()].sort((a, b) => a.message.messageId.localeCompare(b.message.messageId))
    for (const entry of entries) {
      entry.myReplies.sort((a, b) => a.messageId.localeCompare(b.messageId))
    }
    return entries
  }

  function getFlatItems(): FlatItem[] {
    const items: FlatItem[] = []
    for (const entry of timeline) {
      items.push({ id: entry.message.messageId, kind: 'message', message: entry.message })
      for (const reply of entry.myReplies) {
        items.push({ id: reply.messageId, kind: 'reply', reply, read: entry.artistRead })
      }
    }
    return items.sort((a, b) => a.id.localeCompare(b.id))
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !effectiveTargetId || !myUserId || isPending) {
      return
    }

    const messageId = effectiveTargetId
    try {
      const { messageId: replyMessageId } = await sendReply({ messageId, body: { contentType: 'text', text } })
      const reply: ChatReplyDTO = {
        messageId: replyMessageId,
        targetMessageId: messageId,
        senderId: myUserId,
        contentType: 'text',
        content: { text },
        createdAt: new Date().toISOString(),
      }
      setOptimisticReplies((prev) => ({ ...prev, [messageId]: [...(prev[messageId] ?? []), reply] }))
      setInput('')
      setReplyTargetId(null)
    } catch {
      // Surface nothing inline; the input keeps the text so the fan can retry.
    }
  }

  // Owners belong in the studio, not the fan room.
  useEffect(() => {
    if (isOwner) {
      router.replace(`/sobok/studio/${handle}`)
    }
  }, [isOwner, handle, router])

  // Live broadcast requires entitlement (the gateway rejects b: otherwise). Subscribe to
  // new messages and append them; the fan never receives other fans' replies.
  useEffect(() => {
    if (!artist || !entitled) {
      return
    }

    const room = `b:${artist.id}`
    subscribeRoom(room)
    const off = onMessage((msgRoom, msg) => {
      if (msgRoom === room && msg.kind === 'broadcast') {
        setRealtimeMessages((prev) =>
          prev.some((b) => b.messageId === msg.messageId) ? prev : [...prev, messageToMessage(msg)],
        )
      }
    })

    return () => {
      off()
      unsubscribeRoom(room)
    }
  }, [artist, entitled, onMessage, subscribeRoom, unsubscribeRoom])

  // Advance the broadcast read watermark as new messages arrive.
  useEffect(() => {
    if (entitled && latestMessageId) {
      markRead({ lastReadMessageId: latestMessageId })
    }
  }, [entitled, latestMessageId, handle, markRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [flatItems.length])

  if (isArtistLoading || !artist || isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#A6D5E9]/10 dark:bg-[#0a0a0c]">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-900" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center bg-[#A6D5E9]/10 dark:bg-[#0a0a0c]">
        <p className="text-[15px] text-gray-600 dark:text-gray-300">이 아티스트의 채팅을 보려면 구독이 필요해요.</p>
        <Link href="/sobok" className="text-indigo-500 font-semibold text-sm">
          채팅 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#A6D5E9]/15 dark:bg-[#0a0a0c] relative">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-2 border-b border-gray-200/40 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl absolute top-0 w-full z-10">
        <div className="flex items-center gap-2">
          <Link
            href="/sobok"
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h2 className="font-bold text-[17px] text-gray-900 dark:text-white flex items-center gap-1.5">
            {artist.displayName}
            {artist.emoji && <span>{artist.emoji}</span>}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-[72px] pb-6 space-y-4 custom-scrollbar flex flex-col"
      >
        {isFetchingNextPage && <div className="text-center text-xs text-gray-400 py-2">불러오는 중...</div>}

        {flatItems.map((item) =>
          item.kind === 'message' ? (
            // Artist message — tap to target it for the next reply
            <div key={item.id} className="flex justify-start w-full">
              <div className="flex max-w-[80%] flex-row items-end gap-2">
                <img
                  src={artist.imageURL || `https://ui-avatars.com/api/?name=${artist.displayName}&background=random`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shadow-sm border border-black/5 dark:border-white/10 shrink-0"
                />
                <div className="flex items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setReplyTargetId(item.message.messageId === latestMessageId ? null : item.message.messageId)
                    }
                    className={`text-left px-3.5 py-2 rounded-2xl rounded-bl-[4px] shadow-sm text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap bg-white dark:bg-white/10 text-gray-900 dark:text-white border transition-colors ${
                      replyTargetId === item.message.messageId
                        ? 'border-indigo-400 dark:border-indigo-500'
                        : 'border-gray-100/50 dark:border-white/5'
                    }`}
                  >
                    {textOf(item.message.content)}
                  </button>
                  <span className="text-[10px] text-gray-400 mb-0.5 shrink-0 font-medium">
                    {new Date(item.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // The fan's own reply (right-aligned), placed at its own send time
            <div key={item.id} className="flex justify-end w-full">
              <div className="flex flex-col items-end">
                <div className="flex items-end gap-1.5 flex-row-reverse">
                  <div className="px-3.5 py-2 rounded-2xl rounded-br-[4px] shadow-sm text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap bg-[#ffe800] dark:bg-indigo-500 text-gray-900 dark:text-white">
                    {textOf(item.reply.content)}
                  </div>
                  <div className="flex flex-col items-end mb-0.5 shrink-0">
                    {item.read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(item.reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply-target banner when answering an older message */}
      {replyingToOlder && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border-t border-indigo-100 dark:border-indigo-500/20 text-[13px] text-indigo-700 dark:text-indigo-300 z-10">
          <span className="truncate">이전 메시지에 답장 중</span>
          <button type="button" onClick={() => setReplyTargetId(null)} className="p-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/5 p-2.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] z-10">
        {!entitled ? (
          <p className="text-center text-[13px] text-gray-500 dark:text-gray-400 py-2">
            구독이 만료되어 답장을 보낼 수 없어요. 재구독 후 이용해 주세요.
          </p>
        ) : (
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
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent border-none py-[10px] px-1 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none max-h-28"
              maxRows={4}
              disabled={isPending || !effectiveTargetId}
            />
            <button
              className="p-[9px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:dark:bg-indigo-900 text-white rounded-full transition-all shrink-0 shadow-sm"
              disabled={!input.trim() || isPending || !effectiveTargetId}
              onClick={() => void handleSend()}
              type="button"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
