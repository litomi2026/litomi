'use client'

import type { ChatReplyWithFan } from '@litomi/contracts'
import { ChevronLeft } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import useRoomChannel from '../_hooks/useRoomChannel'
import { avatarURL, mergeById } from '../_lib/chat'
import { formatTime } from '../_lib/format'
import useArtistQuery from '../_query/useArtistQuery'
import useMarkMessageReadMutation from '../_query/useMarkMessageReadMutation'
import useMessageReplyQuery from '../_query/useMessageReplyQuery'
import ChatMessageList from './ChatMessageList'

export default function StudioReplyRoom({ handle, messageId }: { handle: string; messageId: string }) {
  const [liveReplies, setLiveReplies] = useState<ChatReplyWithFan[]>([])
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessageReplyQuery(handle, messageId)
  const { mutate: markMessageRead } = useMarkMessageReadMutation(handle, messageId)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Sobok.replyRoom')

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner
  const fetchedReplies = data?.pages.flatMap((page) => page.replies) ?? []
  const replies = mergeById(fetchedReplies, liveReplies, (reply) => reply.messageId)
  const newestReplyId = replies.at(-1)?.messageId

  useEffect(() => {
    if (artistData && !isOwner) {
      router.replace(`/sobok/@${handle}`)
    }
  }, [artistData, isOwner, handle, router])

  // The fan-in reply firehose (c:, owner-only), filtered down to this message's room.
  useRoomChannel(artist && isOwner ? `c:${artist.id}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'reply' || msg.targetMessageId !== messageId) {
        return
      }

      const newReply: ChatReplyWithFan = {
        messageId: msg.messageId,
        targetMessageId: messageId,
        senderId: msg.senderId,
        contentType: msg.contentType,
        content: msg.content,
        createdAt: msg.createdAt,
      }

      setLiveReplies((prev) => (prev.some((r) => r.messageId === msg.messageId) ? prev : [...prev, newReply]))
    },
  })

  // Mark the room read up to the newest reply → fans see "read" on their reply.
  useEffect(() => {
    if (newestReplyId) {
      markMessageRead({ lastReadMessageId: newestReplyId })
    }
  }, [newestReplyId, handle, messageId, markMessageRead])

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href={`/sobok/studio/${handle}`} className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">{t('title')}</h2>
      </div>

      {/* Replies (all fans; the artist reads the whole room) */}
      <ChatMessageList
        bottomInsetClassName="pb-6"
        dateOf={(reply) => new Date(reply.createdAt).getTime()}
        emptyState={<p className="text-sm text-zinc-400">{t('empty')}</p>}
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(reply) => reply.messageId}
        items={replies}
        onLoadOlder={fetchNextPage}
        renderItem={(reply) => {
          const fanName = reply.fan?.nickname || t('fanNumber', { id: reply.senderId })
          return (
            <div className="flex justify-start w-full">
              <div className="flex max-w-[80%] flex-row items-end gap-2">
                <img
                  src={avatarURL(fanName, reply.fan?.imageURL)}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
                />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-zinc-400 mb-1 ml-1 font-medium tracking-tight">{fanName}</span>
                  <div className="flex items-end gap-1.5">
                    <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border border-foreground/10">
                      {reply.content.text}
                    </div>
                    <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                      {formatTime(reply.createdAt, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
