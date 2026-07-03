'use client'

import type { ChatMessageDTO, ChatReplyDTO } from '@litomi/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { useChat } from '../_components/ChatProvider'
import { buildFanTimeline, flattenFanTimeline, getQuotedReplyIds, toChatMessageDTO } from '../_lib/chat'
import useChatMessageQuery from '../_query/useChatMessageQuery'
import useMarkReadMutation from '../_query/useMarkReadMutation'
import useSendReplyMutation from '../_query/useSendReplyMutation'
import useRoomChannel from './useRoomChannel'

interface UseFanChatRoomInput {
  artistId: number
  entitled: boolean
  handle: string
}

// Everything the fan room needs from the data layer: paged history ∪ realtime broadcasts
// ∪ optimistic replies as one memoized timeline, plus read-marking and reply sending.
export default function useFanChatRoom({ artistId, entitled, handle }: UseFanChatRoomInput) {
  const [optimisticReplies, setOptimisticReplies] = useState<Record<string, ChatReplyDTO[]>>({})
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageDTO[]>([])
  const { myUserId, connectionId } = useChat()
  const prevConnectionIdRef = useRef(connectionId)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessageQuery(handle)
  const { mutateAsync: postReply, isPending: isSending } = useSendReplyMutation(handle)
  const { mutate: markRead } = useMarkReadMutation(handle)
  const queryClient = useQueryClient()

  const timeline = buildFanTimeline(
    data?.pages.flatMap((page) => page.messages) ?? [],
    realtimeMessages,
    optimisticReplies,
  )

  const flatItems = flattenFanTimeline(timeline)
  const entryById = new Map(timeline.map((entry) => [entry.message.messageId, entry]))
  const quotedReplyIds = getQuotedReplyIds(flatItems)
  const latestMessageId = timeline.at(-1)?.message.messageId ?? null
  const room = entitled ? `b:${artistId}` : null

  // Rejects on failure so the composer keeps the draft for retry.
  async function sendReply(targetMessageId: string, text: string) {
    if (!myUserId) {
      throw new Error('아직 연결되지 않았어요.')
    }

    const { messageId } = await postReply({
      messageId: targetMessageId,
      body: {
        contentType: 'text',
        text,
      },
    })

    const reply: ChatReplyDTO = {
      messageId,
      targetMessageId,
      senderId: myUserId,
      contentType: 'text',
      content: { text },
      createdAt: new Date().toISOString(),
    }

    setOptimisticReplies((prev) => ({
      ...prev,
      [targetMessageId]: [...prev[targetMessageId], reply],
    }))
  }

  useRoomChannel(room, {
    // Append new broadcasts; the fan never receives other fans' replies.
    onMessage: (msg) => {
      if (msg.kind === 'broadcast') {
        setRealtimeMessages((prev) =>
          prev.some((b) => b.messageId === msg.messageId) ? prev : [...prev, toChatMessageDTO(msg)],
        )
      }
    },
    // 서버가 자격 상실(만료/환불)로 방에서 내보내면 구독 상태를 다시 조회해 UI를 전환한다.
    onRevoked: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatArtist(handle) })
    },
  })

  useEffect(() => {
    if (entitled && latestMessageId) {
      markRead({ lastReadMessageId: latestMessageId })
    }
  }, [entitled, latestMessageId, markRead])

  // Broadcasts sent while the socket was down never replay — refetch on reconnect to close
  // the gap. connectionId increments per successful open, so >1 means a reconnect.
  useEffect(() => {
    if (connectionId > prevConnectionIdRef.current && prevConnectionIdRef.current > 0) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    }
    prevConnectionIdRef.current = connectionId
  }, [connectionId, handle, queryClient])

  return {
    entryById,
    fetchNextPage,
    flatItems,
    hasNextPage,
    isFetchingNextPage,
    isSending,
    latestMessageId,
    quotedReplyIds,
    sendReply,
  }
}
