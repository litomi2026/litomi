'use client'

import type { ChatFeedItem } from '@litomi/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { useChat } from '../_components/ChatProvider'
import { appendById, computeQuotes, mergeFeedItems } from '../_lib/chat'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import useReadWatermark from './useReadWatermark'
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

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: isLoadingHistory,
  } = useChatMessageQuery(handle)

  const { mutateAsync: postReply, isPending: isSending } = useSendReplyMutation(handle)
  const { mutateAsync: markRead } = useMarkReadMutation(handle)
  const queryClient = useQueryClient()

  const items = mergeFeedItems(data?.pages.flatMap((page) => page.items) ?? [], realtimeItems, optimisticItems)
  const quotes = computeQuotes(items)
  const itemById = new Map(items.map((item) => [item.messageId, item]))
  const latestMessageId = items.at(-1)?.messageId
  const replyReadCursor = mergeReplyReadCursors(data?.pages.map((page) => page.replyReadCursor) ?? [])
  const lastArtistMessage = findLastArtistMessage(items)

  const usedReplies = items.filter(
    (item) => item.kind === 'fanReply' && (!lastArtistMessage || item.messageId > lastArtistMessage.messageId),
  ).length

  // 명시 선택이 없을 때의 답장 대상: 화면의 아티스트 마지막 메시지. 1:1 답장이면 그 답장을
  // 인용하는 형태 — 말풍선을 탭해서 선택했을 때와 같은 문법이다.
  const latestArtistTarget: ReplyTarget | undefined =
    lastArtistMessage &&
    (lastArtistMessage.kind === 'broadcast'
      ? { contextMessageId: lastArtistMessage.messageId }
      : { contextMessageId: lastArtistMessage.contextMessageId, quotedMessageId: lastArtistMessage.messageId })

  // Room-level receipt: 아티스트의 답장방 워터마크가 내 답장 위치를 지났으면 읽힌 것.
  function isReadByArtist(item: ChatFeedItem): boolean {
    if (item.kind !== 'fanReply') {
      return false
    }

    const watermark = replyReadCursor.get(item.contextMessageId)
    return Boolean(watermark && item.messageId <= watermark)
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
    setRealtimeItems(appendById(item))
  }

  function addOptimistic(item: ChatFeedItem) {
    setOptimisticItems(appendById(item))
  }

  // Messages relayed while the socket was down never replay — refetch on reconnect to close the
  // gap. connectionId increments per successful open, so >1 means a reconnect.
  useEffect(() => {
    if (connectionId > prevConnectionIdRef.current && prevConnectionIdRef.current > 0) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    }
    prevConnectionIdRef.current = connectionId
  }, [connectionId, handle, queryClient])

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
          quotedMessageId: msg.quotedMessageId,
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        })
      }
    },
  })

  useReadWatermark(latestMessageId, (lastReadMessageId) => markRead({ lastReadMessageId }))

  return {
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
  }
}

type ArtistFeedItem = Exclude<ChatFeedItem, { kind: 'fanReply' }>

function findLastArtistMessage(items: ChatFeedItem[]): ArtistFeedItem | undefined {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]

    if (item.kind !== 'fanReply') {
      return item
    }
  }

  return undefined
}

// 페이지별 사이드카를 방(contextMessageId) 단위로 합친다. 페이지마다 조회 시점이 달라
// 워터마크가 어긋날 수 있으므로 항상 더 나중 값(GREATEST)을 취한다.
function mergeReplyReadCursors(pages: (Record<string, string> | undefined)[]): Map<string, string> {
  const merged = new Map<string, string>()

  for (const page of pages) {
    for (const [contextMessageId, watermark] of Object.entries(page ?? {})) {
      const existing = merged.get(contextMessageId)

      if (!existing || watermark > existing) {
        merged.set(contextMessageId, watermark)
      }
    }
  }

  return merged
}
