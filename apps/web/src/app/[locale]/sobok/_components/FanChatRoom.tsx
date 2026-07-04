'use client'

import type { ChatArtistBrief, ChatSubscriptionDTO } from '@litomi/contracts'
import { REPLY_MAX_PER_MESSAGE } from '@litomi/domain/chat/policy'
import { ChevronLeft, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import useFanChatRoom from '../_hooks/useFanChatRoom'
import { avatarURL, type FanTimelineItem } from '../_lib/chat'
import { ArtistMessageBubble, FanReplyBubble, QuotedMessage } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import ComposerDock from './ComposerDock'
import SubscriptionMenu from './SubscriptionMenu'

interface Props {
  artist: ChatArtistBrief
  entitled: boolean
  handle: string
  onSubscribe: () => void
  replyTextLimit: number | undefined
  subscribeError: string | null
  subscribing: boolean
  subscription: ChatSubscriptionDTO | undefined
}

export default function FanChatRoom({
  artist,
  entitled,
  handle,
  onSubscribe,
  replyTextLimit,
  subscribeError,
  subscribing,
  subscription,
}: Props) {
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const listRef = useRef<ChatMessageListHandle>(null)
  const tSubscribe = useTranslations('Sobok.subscribe')
  const t = useTranslations('Sobok.fanRoom')

  const {
    entryById,
    fetchNextPage,
    flatItems,
    hasNextPage,
    isFetchingNextPage,
    isSending,
    latestMessageId,
    quotedReplyIds,
    sendReply,
  } = useFanChatRoom({ artistId: artist.id, entitled, handle })

  const effectiveTargetId = replyTargetId ?? latestMessageId
  const replyingToOlder = replyTargetId !== null && replyTargetId !== latestMessageId
  const replyTarget = replyTargetId ? entryById.get(replyTargetId)?.message : null
  const usedReplies = effectiveTargetId ? (entryById.get(effectiveTargetId)?.myReplies.length ?? 0) : 0
  const repliesExhausted = replyTextLimit !== undefined && usedReplies >= REPLY_MAX_PER_MESSAGE

  // Jump to the message a reply quotes and flash it briefly. The target may be virtualized out of
  // the DOM, so we scroll by index through the list rather than holding a node ref.
  function scrollToMessage(messageId: string) {
    listRef.current?.scrollToKey(messageId, { align: 'center' })
    setHighlightedId(messageId)
  }

  async function handleSend(text: string) {
    if (!effectiveTargetId) {
      return
    }

    await sendReply(effectiveTargetId, text)
    setReplyTargetId(null)
    listRef.current?.scrollToBottom()
  }

  function renderTimelineItem(item: FanTimelineItem) {
    if (item.kind === 'message') {
      return (
        <ArtistMessageBubble
          avatarSrc={avatarURL(artist.displayName, artist.imageURL)}
          isHighlighted={highlightedId === item.message.messageId}
          isTarget={replyTargetId === item.message.messageId}
          message={item.message}
          onSelect={() => setReplyTargetId(item.message.messageId === latestMessageId ? null : item.message.messageId)}
        />
      )
    }

    const quoteTarget = quotedReplyIds.has(item.reply.messageId)
      ? (entryById.get(item.reply.targetMessageId)?.message ?? null)
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
  }

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
        {entitled && subscription && (
          <SubscriptionMenu handle={handle} subscription={subscription} onResume={onSubscribe} resuming={subscribing} />
        )}
      </div>

      {/* Messages */}
      <ChatMessageList
        bottomInsetClassName="pb-[var(--sobok-dock-h)]"
        dateOf={(item) => new Date(item.kind === 'message' ? item.message.createdAt : item.reply.createdAt).getTime()}
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(item) => item.id}
        items={flatItems}
        onLoadOlder={fetchNextPage}
        ref={listRef}
        renderItem={renderTimelineItem}
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
                label={t('replyTo', { name: artist.displayName })}
                onClick={() => scrollToMessage(replyTarget.messageId)}
                preview={replyTarget.content.text}
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
            onSend={handleSend}
            placeholder={
              repliesExhausted ? t('repliesExhausted', { count: REPLY_MAX_PER_MESSAGE }) : t('composerPlaceholder')
            }
            disabled={isSending || !effectiveTargetId || repliesExhausted}
            maxLength={replyTextLimit}
          />
        ) : (
          <div className="space-y-2 px-4 py-3">
            <p className="text-center text-sm text-zinc-400">{t('expiredNotice')}</p>
            {subscribeError && <p className="text-center text-xs text-red-400">{subscribeError}</p>}
            <button
              type="button"
              onClick={onSubscribe}
              disabled={subscribing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
            >
              {subscribing && <Loader2 className="h-4 w-4 animate-spin" />}
              {tSubscribe('resubscribe')}
            </button>
          </div>
        )}
      </ComposerDock>
    </div>
  )
}
