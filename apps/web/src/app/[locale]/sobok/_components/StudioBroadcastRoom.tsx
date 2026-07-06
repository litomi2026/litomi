'use client'

import type { ChatFeedItem } from '@litomi/contracts'
import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import useBroadcastRoom from '../_hooks/useBroadcastRoom'
import { avatarURL } from '../_lib/chat'
import { OutgoingBubble } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import ComposerDock from './ComposerDock'
import { MessageFeedSkeleton } from './RoomSkeleton'

// The 메시지 tab content — chrome (header/tabs) belongs to StudioShell, ownership to
// StudioOwnerGuard. Data/realtime/ticker live in useBroadcastRoom; this owns only the view.
export default function StudioBroadcastRoom({ handle }: { handle: string }) {
  const listRef = useRef<ChatMessageListHandle>(null)
  const router = useRouter()
  const t = useTranslations('Sobok.broadcast')

  const {
    messages,
    replyUnread,
    liveReplies,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sendBroadcast,
    isSending,
  } = useBroadcastRoom(handle)

  async function handleSend(text: string) {
    await sendBroadcast(text)
    listRef.current?.scrollToBottom()
  }

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Live fan-reply ticker (sampled: newest few across all messages) */}
      {liveReplies.length > 0 && (
        <div className="shrink-0 border-b border-foreground/10 bg-foreground/5 px-3 py-2">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-zinc-400">{t('liveReplies')}</span>
            </div>
            <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              {liveReplies.map((reply) => {
                const nickname = reply.nickname ?? t('fan')
                return (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => router.push(`/sobok/studio/${handle}/message/${reply.contextMessageId}`)}
                    className="flex max-w-60 shrink-0 items-center gap-1.5 rounded-full bg-zinc-800 py-1 pl-1 pr-3 transition-colors hover:bg-zinc-700"
                  >
                    <img
                      src={avatarURL(nickname, reply.imageURL)}
                      alt=""
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                    />
                    <span className="shrink-0 text-xs font-semibold text-zinc-300">{nickname}</span>
                    <span className="truncate text-xs text-zinc-400">{reply.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Message feed */}
      {isLoading ? (
        <MessageFeedSkeleton className="pb-[calc(var(--sobok-dock-h)+1rem)]" variant="broadcast" />
      ) : (
        <ChatMessageList
          bottomInsetClassName="pb-[var(--sobok-dock-h)]"
          dateOf={(item) => new Date(item.createdAt).getTime()}
          gapClassName="pb-3"
          hasOlder={hasNextPage}
          isLoadingOlder={isFetchingNextPage}
          itemKey={(item) => item.messageId}
          items={messages}
          onLoadOlder={fetchNextPage}
          ref={listRef}
          renderItem={(item: ChatFeedItem) => {
            const unread = replyUnread[item.messageId] ?? 0

            return (
              <OutgoingBubble
                createdAt={item.createdAt}
                footer={
                  <Link
                    href={`/sobok/studio/${handle}/message/${item.messageId}`}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-600"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t('replyRoom')}
                    {unread > 0 && ` · ${t('newReplies', { count: unread > 999 ? '999+' : unread })}`}
                  </Link>
                }
                text={item.content.text}
              />
            )
          }}
          scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
        />
      )}

      {/* Composer island */}
      <ComposerDock>
        <ChatComposer onSend={handleSend} placeholder={t('composerPlaceholder')} disabled={isSending} />
      </ComposerDock>
    </div>
  )
}
