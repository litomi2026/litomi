'use client'

import type { ChatFeedItem } from '@litomi/contracts'
import ms from 'ms'
import { useState } from 'react'
import { appendById, mergeById } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useSendMessageMutation from '../_query/useSendMessageMutation'
import useRoomChannel from './useRoomChannel'

// Rolling window of the most recent fan replies shown in the live ticker. This IS the
// client-side sampling: under a burst the artist only ever sees the latest few (server-side
// rate sampling on c:{artistId} caps the firehose upstream too).
const TICKER_SIZE = 6

export interface LiveReply {
  id: string
  contextMessageId: string
  // null = the fan brief didn't resolve; the view renders a "팬" fallback.
  nickname: string | null
  imageURL: string | null
  text: string
}

// The studio broadcast tab's data controller: the artist's own feed (∪ realtime b: ∪ optimistic
// sends), the per-bubble reply-unread counts, and the sampled fan-reply ticker (c:). The
// component owns only the view (ticker chips, feed rendering, scroll).
export default function useBroadcastRoom(handle: string) {
  const [realtimeMessages, setRealtimeMessages] = useState<ChatFeedItem[]>([])
  const [liveReplies, setLiveReplies] = useState<LiveReply[]>([])
  const { data: artistData } = useArtistQuery(handle)
  const { mutateAsync: sendMessage, isPending: isSending } = useSendMessageMutation(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle, {
    refetchInterval: ms('20 seconds'),
  })

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false
  const pages = data?.pages ?? []
  const messages = mergeById(
    pages.flatMap((page) => page.items),
    realtimeMessages,
    (item) => item.messageId,
  )
  const replyUnread: Record<string, number> = pages.reduce((acc, page) => Object.assign(acc, page.replyUnread), {})

  async function sendBroadcast(text: string) {
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

      const reply: LiveReply = {
        id: msg.messageId,
        contextMessageId: msg.contextMessageId,
        nickname: msg.fan?.nickname ?? null,
        imageURL: msg.fan?.imageURL ?? null,
        text: msg.content.text,
      }

      setLiveReplies((prev) => [reply, ...prev.filter((r) => r.id !== msg.messageId)].slice(0, TICKER_SIZE))
    },
  })

  return {
    messages,
    replyUnread,
    liveReplies,
    isLoading: !data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sendBroadcast,
    isSending,
  }
}
