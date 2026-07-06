'use client'

import type { ChatArtistBrief, ChatFeedItem, ChatSubscriptionDTO } from '@litomi/contracts'
import { REPLY_MAX_PER_ARTIST_MESSAGE } from '@litomi/domain/chat/policy'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import useFanChatRoom, { type ReplyTarget } from '../_hooks/useFanChatRoom'
import { avatarURL } from '../_lib/chat'
import { ArtistBubble, type BubbleQuote, FanReplyBubble, QuotedMessage } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import ComposerDock from './ComposerDock'
import { MessageFeedSkeleton } from './RoomSkeleton'
import SubscriptionMenu from './SubscriptionMenu'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

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
    isLoadingHistory,
    isReadByArtist,
    isSending,
    itemById,
    items,
    latestArtistTarget,
    quotes,
    sendReply,
    usedReplies,
  } = useFanChatRoom({ artistId: artist.id, entitled, handle })

  // 명시 선택이 없으면 아티스트의 마지막 메시지(방송 ∪ 1:1 답장)에 답장한다 — 쿼터의 기준점과
  // 같은 대상. 쿼터는 선택한 말풍선과 무관하며, 아티스트의 새 메시지가 오면 다시 채워진다.
  const effectiveTarget = replyTarget ?? latestArtistTarget
  const repliesExhausted = replyTextLimit !== undefined && usedReplies >= REPLY_MAX_PER_ARTIST_MESSAGE
  const targetPreview = replyTarget ? itemById.get(replyTarget.quotedMessageId ?? replyTarget.contextMessageId) : null

  // Jump to a quoted message and flash it briefly. It may be virtualized out of the DOM, so we
  // scroll by key through the list rather than holding a node ref.
  function scrollToMessage(messageId: string) {
    listRef.current?.scrollToKey(messageId, { align: 'center' })
    setHighlightedId(messageId)
  }

  async function handleSend(text: string) {
    if (!effectiveTarget) {
      return
    }

    await sendReply(effectiveTarget, text)
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
      return (
        <FanReplyBubble
          isHighlighted={highlightedId === item.messageId}
          isRead={isReadByArtist(item)}
          message={item}
          onQuoteClick={scrollToMessage}
          quote={quoteFor(item)}
        />
      )
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
      <PageHeader
        back={<HeaderBackLink className="lg:hidden" href="/sobok" />}
        title={
          <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
            <Avatar className="h-8 w-8" imageURL={artist.imageURL} name={artist.displayName} />
            <span className="truncate">
              {artist.displayName}
              {artist.emoji && <span className="ml-1.5">{artist.emoji}</span>}
            </span>
            <span className="shrink-0 text-sm font-normal text-zinc-500">@{handle}</span>
          </h2>
        }
        actions={
          entitled &&
          subscription && (
            <SubscriptionMenu
              handle={handle}
              subscription={subscription}
              onResume={onSubscribe}
              resuming={subscribing}
            />
          )
        }
      />

      {/* Messages */}
      {isLoadingHistory ? (
        <MessageFeedSkeleton className="pb-[calc(var(--sobok-dock-h)+1rem)]" />
      ) : (
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
      )}

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
              repliesExhausted
                ? t('repliesExhausted', { count: REPLY_MAX_PER_ARTIST_MESSAGE })
                : t('composerPlaceholder')
            }
            disabled={isSending || !effectiveTarget || repliesExhausted}
            maxLength={replyTextLimit}
          />
        ) : (
          <div className="space-y-2 px-4 py-3">
            <p className="text-center text-sm text-zinc-400">{t('expiredNotice')}</p>
            {subscribeError && <p className="text-center text-xs text-red-400">{subscribeError}</p>}
            <Button busy={subscribing} className="w-full rounded-2xl py-2.5" onClick={onSubscribe}>
              {tSubscribe('resubscribe')}
            </Button>
          </div>
        )}
      </ComposerDock>
    </div>
  )
}
