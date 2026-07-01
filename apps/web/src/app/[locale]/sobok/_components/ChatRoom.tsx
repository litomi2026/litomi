'use client'

import type { ChatMessageDTO, ChatReplyDTO } from '@litomi/contracts'
import { Check, CheckCheck, ChevronLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { avatarUrl, contentPreview, textOf, toChatMessageDTO } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import ChatComposer from './ChatComposer'
import { useChat } from './ChatProvider'
import ComposerDock from './ComposerDock'

interface TimelineEntry {
  message: ChatMessageDTO
  myReplies: ChatReplyDTO[]
  artistRead: boolean
}

type FlatItem =
  | { id: string; kind: 'message'; message: ChatMessageDTO }
  | { id: string; kind: 'reply'; reply: ChatReplyDTO; read: boolean }

export default function ChatRoom({ handle }: { handle: string }) {
  const [optimisticReplies, setOptimisticReplies] = useState<Record<string, ChatReplyDTO[]>>({})
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageDTO[]>([])
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef(new Map<string, HTMLDivElement>())
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
  const messageById = new Map(timeline.map((entry) => [entry.message.messageId, entry.message]))
  const replyTarget = replyTargetId ? messageById.get(replyTargetId) : null
  const quotedReplyIds = getQuotedReplyIds(flatItems)

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

  // Jump to the message a reply quotes and flash it briefly.
  function scrollToMessage(messageId: string) {
    const el = messageRefs.current.get(messageId)
    if (!el) {
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedId(messageId)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !effectiveTargetId || !myUserId || isPending) {
      return
    }

    const messageId = effectiveTargetId

    try {
      const { messageId: replyMessageId } = await sendReply({
        messageId,
        body: {
          contentType: 'text',
          text,
        },
      })

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

  // Live broadcast requires entitlement (the gateway rejects b: otherwise).
  useEffect(() => {
    if (!artist || !entitled) {
      return
    }

    const room = `b:${artist.id}`
    subscribeRoom(room)

    return () => {
      unsubscribeRoom(room)
    }
  }, [artist, entitled, subscribeRoom, unsubscribeRoom])

  // Subscribe to new messages and append them; the fan never receives other fans' replies.
  useEffect(() => {
    if (!artist || !entitled) {
      return
    }

    const room = `b:${artist.id}`

    return onMessage((msgRoom, msg) => {
      if (msgRoom === room && msg.kind === 'broadcast') {
        setRealtimeMessages((prev) =>
          prev.some((b) => b.messageId === msg.messageId) ? prev : [...prev, toChatMessageDTO(msg)],
        )
      }
    })
  }, [artist, entitled, onMessage])

  useEffect(() => {
    if (entitled && latestMessageId) {
      markRead({ lastReadMessageId: latestMessageId })
    }
  }, [entitled, latestMessageId, handle, markRead])

  // Clear the jump highlight after it flashes.
  useEffect(() => {
    if (!highlightedId) {
      return
    }

    const timer = window.setTimeout(() => setHighlightedId(null), 1500)

    return () => window.clearTimeout(timer)
  }, [highlightedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [flatItems.length])

  if (isArtistLoading || !artist || isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center bg-background">
        <p className="text-base text-zinc-300">이 아티스트의 채팅을 보려면 구독이 필요해요.</p>
        <Link href="/sobok" className="text-indigo-500 font-semibold text-sm">
          채팅 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-2 border-b border-foreground/10 bg-background/80">
        <div className="flex items-center gap-2">
          <Link href="/sobok" className="p-2 text-zinc-400 hover:text-foreground transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h2 className="font-bold text-lg text-foreground flex items-center gap-1.5">
            {artist.displayName}
            {artist.emoji && <span>{artist.emoji}</span>}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-(--sobok-dock-h) space-y-4 custom-scrollbar flex flex-col"
      >
        {isFetchingNextPage && <div className="text-center text-xs text-zinc-400 py-2">불러오는 중...</div>}

        {flatItems.map((item) => {
          if (item.kind === 'message') {
            // Artist message — tap to target it for the next reply, or land here from a reply's quote.
            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) {
                    messageRefs.current.set(item.message.messageId, el)
                  } else {
                    messageRefs.current.delete(item.message.messageId)
                  }
                }}
                className="flex justify-start w-full scroll-mt-20"
              >
                <div className="flex max-w-[80%] flex-row items-end gap-2">
                  <img
                    src={avatarUrl(artist.displayName, artist.imageURL)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
                  />
                  <div className="flex items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyTargetId(item.message.messageId === latestMessageId ? null : item.message.messageId)
                      }
                      className={`text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border transition-all ${
                        replyTargetId === item.message.messageId ? 'border-indigo-400' : 'border-foreground/10'
                      } ${highlightedId === item.message.messageId ? 'ring-2 ring-indigo-400/80' : ''}`}
                    >
                      {textOf(item.message.content)}
                    </button>
                    <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                      {new Date(item.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          }

          // The fan's own reply (right-aligned) sits at its own send time. It quotes the artist
          // message it answers only when that's an older message, so the context survives when
          // the reply lands far below the original; a reply to the current message stays plain.
          const target = quotedReplyIds.has(item.reply.messageId)
            ? (messageById.get(item.reply.targetMessageId) ?? null)
            : null

          return (
            <div key={item.id} className="flex justify-end w-full">
              <div className="flex max-w-[80%] flex-col items-end">
                <div className="flex items-end gap-1.5 flex-row-reverse">
                  <div className="flex flex-col gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed bg-indigo-500 text-white">
                    {target && (
                      <QuotedMessage
                        label={artist.displayName}
                        onClick={() => scrollToMessage(target.messageId)}
                        preview={contentPreview(target.contentType, target.content)}
                        variant="onMessage"
                      />
                    )}
                    <span className="wrap-break-word whitespace-pre-wrap">{textOf(item.reply.content)}</span>
                  </div>
                  <div className="flex flex-col items-end mb-0.5 shrink-0">
                    {item.read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(item.reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer island — reply-target chip docks above the input on the same surface */}
      <ComposerDock
        preview={
          entitled && replyingToOlder && replyTarget ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <QuotedMessage
                className="flex-1"
                label={`${artist.displayName}에게 답장`}
                onClick={() => scrollToMessage(replyTarget.messageId)}
                preview={contentPreview(replyTarget.contentType, replyTarget.content)}
                variant="standalone"
              />
              <button
                type="button"
                onClick={() => setReplyTargetId(null)}
                className="p-1 shrink-0 text-indigo-500 hover:text-indigo-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null
        }
      >
        {!entitled ? (
          <p className="text-center text-sm text-zinc-400 py-3 px-4">
            구독이 만료되어 답장을 보낼 수 없어요. 재구독 후 이용해 주세요.
          </p>
        ) : (
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            placeholder="메시지를 입력하세요..."
            disabled={isPending || !effectiveTargetId}
          />
        )}
      </ComposerDock>
    </div>
  )
}

function getQuotedReplyIds(items: FlatItem[]): Set<string> {
  const ids = new Set<string>()
  let lastMessageId: string | null = null

  for (const item of items) {
    if (item.kind === 'message') {
      lastMessageId = item.message.messageId
    } else if (item.reply.targetMessageId !== lastMessageId) {
      ids.add(item.reply.messageId)
    }
  }

  return ids
}

type Props = {
  label: string
  preview: string
  onClick: () => void
  variant: 'onMessage' | 'standalone'
  className?: string
}

function QuotedMessage({ label, preview, onClick, variant, className = '' }: Props) {
  const accent = variant === 'onMessage' ? 'border-white/45' : 'border-indigo-400'
  const labelTone = variant === 'onMessage' ? 'text-white' : 'text-indigo-500'
  const previewTone = variant === 'onMessage' ? 'text-white/75' : 'text-zinc-400'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-col items-start border-l-2 pl-2 text-left transition-opacity hover:opacity-70 ${accent} ${className}`}
    >
      <span className={`max-w-full truncate text-xs font-semibold ${labelTone}`}>{label}</span>
      <span className={`line-clamp-1 max-w-full text-xs leading-snug ${previewTone}`}>{preview}</span>
    </button>
  )
}
