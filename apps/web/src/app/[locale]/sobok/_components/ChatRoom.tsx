'use client'

import type { ChatMessageDTO, ChatReplyDTO } from '@litomi/contracts'
import { ChevronLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { avatarURL, contentPreview, toChatMessageDTO } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import { ArtistMessageBubble, FanReplyBubble, QuotedMessage } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
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
  const listRef = useRef<ChatMessageListHandle>(null)
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

  // Jump to the message a reply quotes and flash it briefly. The target may be virtualized out of
  // the DOM, so we scroll by index through the list rather than holding a node ref.
  function scrollToMessage(messageId: string) {
    listRef.current?.scrollToKey(messageId, { align: 'center' })
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
      listRef.current?.scrollToBottom()
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
      <ChatMessageList
        bottomInsetClassName="pb-[var(--sobok-dock-h)]"
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(item) => item.id}
        items={flatItems}
        onLoadOlder={fetchNextPage}
        ref={listRef}
        renderItem={(item) => {
          if (item.kind === 'message') {
            return (
              <ArtistMessageBubble
                avatarSrc={avatarURL(artist.displayName, artist.imageURL)}
                isHighlighted={highlightedId === item.message.messageId}
                isTarget={replyTargetId === item.message.messageId}
                message={item.message}
                onSelect={() =>
                  setReplyTargetId(item.message.messageId === latestMessageId ? null : item.message.messageId)
                }
              />
            )
          }

          const quoteTarget = quotedReplyIds.has(item.reply.messageId)
            ? (messageById.get(item.reply.targetMessageId) ?? null)
            : null

          return (
            <FanReplyBubble
              onQuoteClick={scrollToMessage}
              quoteLabel={artist.displayName}
              quoteTarget={quoteTarget}
              read={item.read}
              reply={item.reply}
            />
          )
        }}
        scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
      />

      {/* Composer island — reply-target chip docks above the input on the same surface */}
      <ComposerDock
        preview={
          entitled &&
          replyingToOlder &&
          replyTarget && (
            <div className="flex items-center gap-2 p-4 pb-3 pr-3">
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
          )
        }
      >
        {entitled ? (
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            placeholder="메시지를 입력하세요..."
            disabled={isPending || !effectiveTargetId}
          />
        ) : (
          <p className="text-center text-sm text-zinc-400 py-3 px-4">
            구독이 만료되어 답장을 보낼 수 없어요. 재구독 후 이용해 주세요.
          </p>
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
