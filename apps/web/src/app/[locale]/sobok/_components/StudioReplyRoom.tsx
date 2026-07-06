'use client'

import type { ChatReplyRoomItem } from '@litomi/contracts'
import { X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import useReadWatermark from '../_hooks/useReadWatermark'
import useRoomChannel from '../_hooks/useRoomChannel'
import { appendById, avatarURL, computeReplyRoomQuotes, mergeById } from '../_lib/chat'
import { formatTime } from '../_lib/format'
import useArtistQuery from '../_query/useArtistQuery'
import useMarkMessageReadMutation from '../_query/useMarkMessageReadMutation'
import useMessageReplyQuery from '../_query/useMessageReplyQuery'
import useSendArtistReplyMutation from '../_query/useSendArtistReplyMutation'
import { type BubbleQuote, QuotedMessage } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import ComposerDock from './ComposerDock'
import { MessageFeedSkeleton } from './RoomSkeleton'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

interface AnswerTarget {
  fanId: number
  replyMessageId: string
  fanName: string
  preview: string
}

// 말풍선 하나의 답장방 — 모든 팬의 답장과 아티스트의 답장이 하나의 시간순 플랫 타임라인으로
// 흐른다. 인용 헤더는 인용 대상이 그 시점의 상대편 마지막 메시지가 아닐 때만(팬 방과 같은 문법).
export default function StudioReplyRoom({ handle, messageId }: { handle: string; messageId: string }) {
  const [liveItems, setLiveItems] = useState<ChatReplyRoomItem[]>([])
  const [optimisticItems, setOptimisticItems] = useState<ChatReplyRoomItem[]>([])
  const [answerTarget, setAnswerTarget] = useState<AnswerTarget | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const listRef = useRef<ChatMessageListHandle>(null)
  const { data: artistData } = useArtistQuery(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessageReplyQuery(handle, messageId)
  const { mutateAsync: markMessageRead } = useMarkMessageReadMutation(handle, messageId)
  const { mutateAsync: postAnswer, isPending: isAnswering } = useSendArtistReplyMutation(handle, messageId)
  const locale = useLocale()
  const t = useTranslations('Sobok.replyRoom')

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false
  const fetched = data?.pages.flatMap((page) => page.items) ?? []
  const items = mergeById(fetched, [...liveItems, ...optimisticItems], (item) => item.messageId)
  const quotes = computeReplyRoomQuotes(items)
  const newestFanReplyId = findLastFanReplyId(items)

  function fanNameOf(item: ChatReplyRoomItem): string {
    return item.fan?.nickname || t('fanNumber', { id: item.fanId })
  }

  function quoteFor(item: ChatReplyRoomItem): BubbleQuote | undefined {
    const quote = quotes.get(item.messageId)

    if (!quote) {
      return undefined
    }

    return {
      targetId: quote.targetId,
      preview: quote.preview,
      label: quote.isMine ? t('you') : fanNameOf(item),
    }
  }

  // Jump to a quoted message and flash it briefly (it may be virtualized out of the DOM).
  function scrollToMessage(targetId: string) {
    listRef.current?.scrollToKey(targetId, { align: 'center' })
    setHighlightedId(targetId)
  }

  async function sendAnswer(text: string) {
    if (!answerTarget) {
      return
    }

    const { messageId: answerId } = await postAnswer({
      fanId: answerTarget.fanId,
      body: { contentType: 'text', text, quotedMessageId: answerTarget.replyMessageId },
    })

    setOptimisticItems(
      appendById<ChatReplyRoomItem>({
        messageId: answerId,
        senderRole: 'artist',
        fanId: answerTarget.fanId,
        quotedMessageId: answerTarget.replyMessageId,
        contentType: 'text',
        content: { text },
        createdAt: new Date().toISOString(),
      }),
    )

    setAnswerTarget(null)
    listRef.current?.scrollToBottom()
  }

  // Focused reply room (rr:, un-sampled): live fan replies to THIS message.
  useRoomChannel(artist && isOwner ? `rr:${artist.id}:${messageId}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'fanReply' || msg.contextMessageId !== messageId) {
        return
      }

      const item: ChatReplyRoomItem = {
        messageId: msg.messageId,
        senderRole: 'fan',
        fanId: msg.fanId,
        ...(msg.fan && { fan: { id: msg.fanId, nickname: msg.fan.nickname, imageURL: msg.fan.imageURL } }),
        ...(msg.quotedMessageId && { quotedMessageId: msg.quotedMessageId }),
        contentType: msg.contentType,
        content: msg.content,
        createdAt: msg.createdAt,
      }

      setLiveItems(appendById(item))
    },
  })

  // Mark the room read up to the newest fan reply → clears the studio's unread badge and
  // surfaces as the fan's "읽음" receipt. Gated on tab visibility + throttled by the hook.
  useReadWatermark(newestFanReplyId, (lastReadMessageId) => markMessageRead({ lastReadMessageId }))

  // Clear the jump highlight after it flashes.
  useEffect(() => {
    if (!highlightedId) {
      return
    }

    const timer = window.setTimeout(() => setHighlightedId(null), 1500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [highlightedId])

  function renderItem(item: ChatReplyRoomItem) {
    const isHighlighted = highlightedId === item.messageId
    const quote = quoteFor(item)

    if (item.senderRole === 'artist') {
      return (
        <div className="flex justify-end w-full">
          <div className="flex max-w-[80%] items-end gap-1.5 flex-row-reverse">
            <div
              data-highlighted={isHighlighted || undefined}
              className="flex flex-col gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed bg-indigo-500 text-white data-highlighted:ring-2 data-highlighted:ring-indigo-300/80"
            >
              {quote && (
                <QuotedMessage
                  label={quote.label}
                  onClick={() => scrollToMessage(quote.targetId)}
                  preview={quote.preview}
                  variant="onMessage"
                />
              )}
              <span className="wrap-break-word whitespace-pre-wrap">{item.content.text}</span>
            </div>
            <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
              {formatTime(item.createdAt, locale)}
            </span>
          </div>
        </div>
      )
    }

    const fanName = fanNameOf(item)
    const isTarget = answerTarget?.replyMessageId === item.messageId

    function handleClick() {
      setAnswerTarget((prev) => {
        if (prev?.replyMessageId === item.messageId) {
          return null
        }

        return {
          fanId: item.fanId,
          replyMessageId: item.messageId,
          fanName,
          preview: item.content.text,
        }
      })
    }

    return (
      <div className="flex justify-start w-full">
        <div className="flex max-w-[80%] flex-row items-end gap-2">
          <img
            src={avatarURL(fanName, item.fan?.imageURL)}
            alt=""
            className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-zinc-400 mb-1 ml-1 font-medium tracking-tight">{fanName}</span>
            <div className="flex items-end gap-1.5">
              {/* Tap to pick this reply as the answer target (toggles) — same grammar as
                  the fan room's tappable bubbles. */}
              <button
                type="button"
                aria-pressed={isTarget}
                data-highlighted={isHighlighted || undefined}
                onClick={handleClick}
                className="flex flex-col gap-1.5 text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border border-foreground/10 transition-colors aria-pressed:border-indigo-400 data-highlighted:ring-2 data-highlighted:ring-indigo-400/80"
              >
                {quote && (
                  <QuotedMessage
                    label={quote.label}
                    onClick={() => scrollToMessage(quote.targetId)}
                    preview={quote.preview}
                    variant="onMessage"
                  />
                )}
                <span>{item.content.text}</span>
              </button>
              <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                {formatTime(item.createdAt, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <PageHeader
        back={<HeaderBackLink href={`/sobok/studio/${handle}`} />}
        title={<h2 className="text-lg font-bold text-foreground">{t('title')}</h2>}
      />

      {!data ? (
        // Same feed footprint while the room loads — the composer below is static and real.
        <MessageFeedSkeleton className="pb-[calc(var(--sobok-dock-h)+1rem)]" />
      ) : (
        <ChatMessageList
          bottomInsetClassName="pb-[var(--sobok-dock-h)]"
          dateOf={(item) => new Date(item.createdAt).getTime()}
          emptyState={<p className="text-sm text-zinc-400">{t('empty')}</p>}
          hasOlder={hasNextPage}
          isLoadingOlder={isFetchingNextPage}
          itemKey={(item) => item.messageId}
          items={items}
          onLoadOlder={fetchNextPage}
          ref={listRef}
          renderItem={renderItem}
          scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
        />
      )}

      {/* Composer island — pick a fan reply to answer, then type here */}
      <ComposerDock
        preview={
          answerTarget && (
            <div className="flex items-center gap-2 p-4 pb-3 pr-3">
              <QuotedMessage
                className="flex-1"
                label={t('answering', { name: answerTarget.fanName })}
                onClick={() => scrollToMessage(answerTarget.replyMessageId)}
                preview={answerTarget.preview}
                variant="standalone"
              />
              <button
                type="button"
                onClick={() => setAnswerTarget(null)}
                className="p-1 shrink-0 text-indigo-500 hover:text-indigo-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        }
      >
        <ChatComposer
          onSend={sendAnswer}
          placeholder={answerTarget ? t('answerPlaceholder', { name: answerTarget.fanName }) : t('selectToAnswer')}
          disabled={isAnswering || !answerTarget}
        />
      </ComposerDock>
    </div>
  )
}

function findLastFanReplyId(items: ChatReplyRoomItem[]): string | undefined {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].senderRole === 'fan') {
      return items[i].messageId
    }
  }

  return undefined
}
