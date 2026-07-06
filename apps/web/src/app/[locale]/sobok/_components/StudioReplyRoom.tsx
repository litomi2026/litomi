'use client'

import type { ChatReplyRoomItem } from '@litomi/contracts'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import useMessageJump from '../_hooks/useMessageJump'
import useReplyRoom from '../_hooks/useReplyRoom'
import { avatarURL } from '../_lib/chat'
import { type BubbleQuote, IncomingBubble, OutgoingBubble, QuotedMessage } from './ChatBubbles'
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
// 흐른다. 데이터·실시간·낙관·읽음은 useReplyRoom이 소유하고, 여기선 뷰(선택·하이라이트·스크롤)만.
export default function StudioReplyRoom({ handle, messageId }: { handle: string; messageId: string }) {
  const [answerTarget, setAnswerTarget] = useState<AnswerTarget | null>(null)
  const listRef = useRef<ChatMessageListHandle>(null)
  const { highlightedId, jumpTo } = useMessageJump(listRef)
  const t = useTranslations('Sobok.replyRoom')

  const { items, quotes, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, sendAnswer, isAnswering } =
    useReplyRoom(handle, messageId)

  function fanNameOf(item: ChatReplyRoomItem): string {
    return item.fan?.nickname || t('fanNumber', { id: item.fanId })
  }

  function quoteFor(item: ChatReplyRoomItem): BubbleQuote | undefined {
    const quote = quotes.get(item.messageId)

    if (!quote) {
      return undefined
    }

    return { targetId: quote.targetId, preview: quote.preview, label: quote.isMine ? t('you') : fanNameOf(item) }
  }

  async function handleSend(text: string) {
    if (!answerTarget) {
      return
    }

    await sendAnswer(answerTarget, text)
    setAnswerTarget(null)
    listRef.current?.scrollToBottom()
  }

  function renderItem(item: ChatReplyRoomItem) {
    const isHighlighted = highlightedId === item.messageId

    if (item.senderRole === 'artist') {
      return (
        <OutgoingBubble
          createdAt={item.createdAt}
          isHighlighted={isHighlighted}
          onQuoteClick={jumpTo}
          quote={quoteFor(item)}
          text={item.content.text}
        />
      )
    }

    const fanName = fanNameOf(item)

    return (
      <IncomingBubble
        avatarSrc={avatarURL(fanName, item.fan?.imageURL)}
        createdAt={item.createdAt}
        isHighlighted={isHighlighted}
        isSelected={answerTarget?.replyMessageId === item.messageId}
        onQuoteClick={jumpTo}
        onSelect={() =>
          setAnswerTarget((prev) =>
            prev?.replyMessageId === item.messageId
              ? null
              : { fanId: item.fanId, replyMessageId: item.messageId, fanName, preview: item.content.text },
          )
        }
        quote={quoteFor(item)}
        senderName={fanName}
        text={item.content.text}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <PageHeader
        back={<HeaderBackLink href={`/sobok/studio/${handle}`} />}
        title={<h2 className="text-lg font-bold text-foreground">{t('title')}</h2>}
      />

      {isLoading ? (
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
                onClick={() => jumpTo(answerTarget.replyMessageId)}
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
          onSend={handleSend}
          placeholder={answerTarget ? t('answerPlaceholder', { name: answerTarget.fanName }) : t('selectToAnswer')}
          disabled={isAnswering || !answerTarget}
        />
      </ComposerDock>
    </div>
  )
}
