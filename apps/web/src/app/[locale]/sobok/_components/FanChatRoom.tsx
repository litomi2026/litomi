'use client'

import type { ChatArtistBrief, ChatFeedItem, ChatSubscriptionDTO } from '@litomi/contracts'
import { REPLY_MAX_PER_MESSAGE } from '@litomi/domain/chat/policy'
import { ChevronLeft, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import useFanChatRoom, { type ReplyTarget } from '../_hooks/useFanChatRoom'
import { avatarURL } from '../_lib/chat'
import { ArtistBubble, type BubbleQuote, FanReplyBubble, QuotedMessage } from './ChatBubbles'
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
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const listRef = useRef<ChatMessageListHandle>(null)
  const tSubscribe = useTranslations('Sobok.subscribe')
  const t = useTranslations('Sobok.fanRoom')

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSending,
    itemById,
    items,
    latestBroadcastId,
    quotes,
    replyCountFor,
    sendReply,
  } = useFanChatRoom({ artistId: artist.id, entitled, handle })

  const effectiveContextId = replyTarget?.contextMessageId ?? latestBroadcastId
  const usedReplies = effectiveContextId ? replyCountFor(effectiveContextId) : 0
  const repliesExhausted = replyTextLimit !== undefined && usedReplies >= REPLY_MAX_PER_MESSAGE
  const targetPreview = replyTarget ? itemById.get(replyTarget.quotedMessageId ?? replyTarget.contextMessageId) : null

  // Jump to a quoted message and flash it briefly. It may be virtualized out of the DOM, so we
  // scroll by key through the list rather than holding a node ref.
  function scrollToMessage(messageId: string) {
    listRef.current?.scrollToKey(messageId, { align: 'center' })
    setHighlightedId(messageId)
  }

  async function handleSend(text: string) {
    if (!effectiveContextId) {
      return
    }

    await sendReply(replyTarget ?? { contextMessageId: effectiveContextId }, text)
    setReplyTarget(null)
    listRef.current?.scrollToBottom()
  }

  function quoteFor(item: ChatFeedItem): BubbleQuote | undefined {
    const quote = quotes.get(item.messageId)

    if (!quote) {
      return undefined
    }

    return {
      targetId: quote.targetId,
      preview: quote.preview,
      label: quote.isMine ? t('you') : artist.displayName,
    }
  }

  function renderItem(item: ChatFeedItem) {
    if (item.kind === 'fanReply') {
      return <FanReplyBubble message={item} onQuoteClick={scrollToMessage} quote={quoteFor(item)} />
    }

    // Broadcast bubble or the artist's 1:1 answer — both selectable to reply.
    const target: ReplyTarget =
      item.kind === 'artistReply'
        ? { contextMessageId: item.contextMessageId, quotedMessageId: item.messageId }
        : { contextMessageId: item.messageId }

    const isTarget =
      item.kind === 'artistReply'
        ? replyTarget?.quotedMessageId === item.messageId
        : replyTarget?.contextMessageId === item.messageId && !replyTarget.quotedMessageId

    return (
      <ArtistBubble
        avatarSrc={avatarURL(artist.displayName, artist.imageURL)}
        isHighlighted={highlightedId === item.messageId}
        isTarget={isTarget}
        message={item}
        onQuoteClick={scrollToMessage}
        onSelect={() =>
          setReplyTarget((prev) =>
            prev?.contextMessageId === target.contextMessageId && prev?.quotedMessageId === target.quotedMessageId
              ? null
              : target,
          )
        }
        quote={quoteFor(item)}
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
            <span className="text-sm font-normal text-zinc-500">@{handle}</span>
          </h2>
        </div>
        {entitled && subscription && (
          <SubscriptionMenu handle={handle} subscription={subscription} onResume={onSubscribe} resuming={subscribing} />
        )}
      </div>

      {/* Messages */}
      <ChatMessageList
        bottomInsetClassName="pb-[var(--sobok-dock-h)]"
        dateOf={(item) => new Date(item.createdAt).getTime()}
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(item) => item.messageId}
        items={items}
        onLoadOlder={fetchNextPage}
        ref={listRef}
        renderItem={renderItem}
        scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
      />

      {/* Composer island — the reply-target chip docks above the input on the same surface */}
      <ComposerDock
        preview={
          entitled &&
          replyTarget &&
          targetPreview && (
            <div className="flex items-center gap-2 p-4 pb-3 pr-3">
              <QuotedMessage
                className="flex-1"
                label={t('replyTo', { name: artist.displayName })}
                onClick={() => scrollToMessage(targetPreview.messageId)}
                preview={targetPreview.content.text}
                variant="standalone"
              />
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
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
            disabled={isSending || !effectiveContextId || repliesExhausted}
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
