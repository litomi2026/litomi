'use client'

import type { ChatFeedItem } from '@litomi/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { useChat } from '../_components/ChatProvider'
import { computeQuotes, mergeFeedItems } from '../_lib/chat'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import useRoomChannel from './useRoomChannel'

interface UseFanChatRoomInput {
  artistId: number
  entitled: boolean
  handle: string
}

// A reply always targets a broadcast bubble (contextMessageId); it may additionally quote a
// specific artist answer (quotedMessageId) for ping-pong.
export interface ReplyTarget {
  contextMessageId: string
  quotedMessageId?: string
}

// Everything the fan room needs: paged history ∪ realtime (broadcasts on b:, the artist's 1:1
// answers on fc:) ∪ optimistic replies, as one merged ChatFeedItem timeline, plus read-marking
// and reply sending.
export default function useFanChatRoom({ artistId, entitled, handle }: UseFanChatRoomInput) {
  const [realtimeItems, setRealtimeItems] = useState<ChatFeedItem[]>([])
  const [optimisticItems, setOptimisticItems] = useState<ChatFeedItem[]>([])
  const { myUserId, connectionId } = useChat()
  const prevConnectionIdRef = useRef(connectionId)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle)
  const { mutateAsync: postReply, isPending: isSending } = useSendReplyMutation(handle)
  const { mutate: markRead } = useMarkReadMutation(handle)
  const queryClient = useQueryClient()

  const items = mergeFeedItems(data?.pages.flatMap((page) => page.items) ?? [], realtimeItems, optimisticItems)
  const quotes = computeQuotes(items)
  const itemById = new Map(items.map((item) => [item.messageId, item]))
  const latestBroadcastId = findLastBroadcastId(items)
  const latestMessageId = items.at(-1)?.messageId ?? null

  // How many replies the fan has already sent to a bubble in the loaded feed (UI hint; the
  // server enforces the real per-message cap).
  function replyCountFor(contextMessageId: string): number {
    return items.reduce(
      (total, item) => total + (item.kind === 'fanReply' && item.contextMessageId === contextMessageId ? 1 : 0),
      0,
    )
  }

  // Rejects on failure so the composer keeps the draft for retry.
  async function sendReply(target: ReplyTarget, text: string) {
    if (!myUserId) {
      throw new Error('아직 연결되지 않았어요.')
    }

    const { messageId } = await postReply({
      messageId: target.contextMessageId,
      body: { contentType: 'text', text, quotedMessageId: target.quotedMessageId },
    })

    addOptimistic({
      kind: 'fanReply',
      messageId,
      contextMessageId: target.contextMessageId,
      quotedMessageId: target.quotedMessageId,
      contentType: 'text',
      content: { text },
      createdAt: new Date().toISOString(),
    })
  }

  function addRealtime(item: ChatFeedItem) {
    setRealtimeItems((prev) =>
      prev.some((existing) => existing.messageId === item.messageId) ? prev : [...prev, item],
    )
  }

  function addOptimistic(item: ChatFeedItem) {
    setOptimisticItems((prev) =>
      prev.some((existing) => existing.messageId === item.messageId) ? prev : [...prev, item],
    )
  }

  useRoomChannel(entitled ? `b:${artistId}` : null, {
    // New broadcasts; the fan never receives other fans' replies here.
    onMessage: (msg) => {
      if (msg.kind === 'broadcast') {
        addRealtime({
          kind: 'broadcast',
          messageId: msg.messageId,
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        })
      }
    },
    // 서버가 자격 상실(만료/환불)로 방에서 내보내면 구독 상태를 다시 조회해 UI를 전환한다.
    onRevoked: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
    },
  })

  // The artist's 1:1 answers to me — always subscribed (readable regardless of entitlement).
  useRoomChannel(myUserId ? `fc:${artistId}:${myUserId}` : null, {
    onMessage: (msg) => {
      if (msg.kind === 'artistReply') {
        addRealtime({
          kind: 'artistReply',
          messageId: msg.messageId,
          contextMessageId: msg.contextMessageId,
          quotedMessageId: msg.quotedMessageId ?? undefined,
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        })
      }
    },
  })

  useEffect(() => {
    if (latestMessageId) {
      markRead({ lastReadMessageId: latestMessageId })
    }
  }, [latestMessageId, markRead])

  // Messages relayed while the socket was down never replay — refetch on reconnect to close the
  // gap. connectionId increments per successful open, so >1 means a reconnect.
  useEffect(() => {
    if (connectionId > prevConnectionIdRef.current && prevConnectionIdRef.current > 0) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    }
    prevConnectionIdRef.current = connectionId
  }, [connectionId, handle, queryClient])

  return {
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
  }
}

function findLastBroadcastId(items: ChatFeedItem[]): string | null {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].kind === 'broadcast') {
      return items[i].messageId
    }
  }
  return null
}
