'use client'

import type { ChatFeedItem } from '@litomi/contracts'
import { MessageCircle } from 'lucide-react'
import ms from 'ms'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import useRoomChannel from '../_hooks/useRoomChannel'
import { appendById, avatarURL, mergeById } from '../_lib/chat'
import { formatTime } from '../_lib/format'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useSendMessageMutation from '../_query/useSendMessageMutation'
import ChatComposer from './ChatComposer'
import ChatMessageList, { type ChatMessageListHandle } from './ChatMessageList'
import ComposerDock from './ComposerDock'
import { MessageFeedSkeleton } from './RoomSkeleton'

// Rolling window of the most recent fan replies shown in the live ticker. This IS the
// client-side sampling: under a burst the artist only ever sees the latest few (server-side
// rate sampling on c:{artistId} caps the firehose upstream too).
const TICKER_SIZE = 6

interface LiveReply {
  id: string
  contextMessageId: string
  nickname: string
  imageURL: string | null
  text: string
}

// The 메시지 tab content — chrome (header/tabs) belongs to StudioShell, ownership is
// guaranteed by StudioOwnerGuard above.
export default function StudioBroadcastRoom({ handle }: { handle: string }) {
  const [realtimeMessages, setRealtimeMessages] = useState<ChatFeedItem[]>([])
  const [liveReplies, setLiveReplies] = useState<LiveReply[]>([])
  const listRef = useRef<ChatMessageListHandle>(null)
  const { data: artistData } = useArtistQuery(handle)
  const { mutateAsync: sendMessage, isPending } = useSendMessageMutation(handle)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Sobok.broadcast')

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle, {
    refetchInterval: ms('20 seconds'),
  })

  const pages = data?.pages ?? []
  const fetchedItems = pages.flatMap((page) => page.items)
  const messages = mergeById(fetchedItems, realtimeMessages, (item) => item.messageId)
  const replyUnread: Record<string, number> = pages.reduce((acc, page) => Object.assign(acc, page.replyUnread), {})
  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false

  async function handleSend(text: string) {
    const { messageId } = await sendMessage({ contentType: 'text', text })

    setRealtimeMessages(
      appendById<ChatFeedItem>({
        kind: 'broadcast',
        messageId,
        contentType: 'text',
        content: { text },
        createdAt: new Date().toISOString(),
      }),
    )

    listRef.current?.scrollToBottom()
  }

  // Own broadcasts (b:).
  useRoomChannel(artist && isOwner ? `b:${artist.id}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'broadcast') {
        return
      }

      setRealtimeMessages(
        appendById<ChatFeedItem>({
          kind: 'broadcast',
          messageId: msg.messageId,
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        }),
      )
    },
  })

  // The fan-in reply firehose (c:, owner-only) drives the live ticker.
  useRoomChannel(artist && isOwner ? `c:${artist.id}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'fanReply') {
        return
      }

      const newReply: LiveReply = {
        id: msg.messageId,
        contextMessageId: msg.contextMessageId,
        nickname: msg.fan?.nickname ?? t('fan'),
        imageURL: msg.fan?.imageURL ?? null,
        text: msg.content.text,
      }

      setLiveReplies((prev) => [newReply, ...prev.filter((reply) => reply.id !== msg.messageId)].slice(0, TICKER_SIZE))
    },
  })

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
              {liveReplies.map((reply) => (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => router.push(`/sobok/studio/${handle}/message/${reply.contextMessageId}`)}
                  className="flex max-w-60 shrink-0 items-center gap-1.5 rounded-full bg-zinc-800 py-1 pl-1 pr-3 transition-colors hover:bg-zinc-700"
                >
                  <img
                    src={avatarURL(reply.nickname, reply.imageURL)}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                  />
                  <span className="shrink-0 text-xs font-semibold text-zinc-300">{reply.nickname}</span>
                  <span className="truncate text-xs text-zinc-400">{reply.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message feed */}
      {!data ? (
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
              <div className="flex justify-end w-full">
                <div className="flex flex-col items-end gap-1 max-w-[80%]">
                  <div className="flex items-end gap-1.5 flex-row-reverse">
                    <div className="px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-indigo-500 text-white">
                      {item.content.text}
                    </div>
                    <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                      {formatTime(item.createdAt, locale)}
                    </span>
                  </div>
                  <Link
                    href={`/sobok/studio/${handle}/message/${item.messageId}`}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t('replyRoom')}
                    {unread > 0 && ` · ${t('newReplies', { count: unread > 999 ? '999+' : unread })}`}
                  </Link>
                </div>
              </div>
            )
          }}
          scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
        />
      )}

      {/* Composer island */}
      <ComposerDock>
        <ChatComposer onSend={handleSend} placeholder={t('composerPlaceholder')} disabled={isPending} />
      </ComposerDock>
    </div>
  )
}
