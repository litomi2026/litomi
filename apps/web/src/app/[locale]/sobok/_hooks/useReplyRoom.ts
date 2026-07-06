'use client'

import type { ChatReplyRoomItem } from '@litomi/contracts'
import { useState } from 'react'
import { appendById, computeReplyRoomQuotes, mergeById } from '../_lib/chat'
import useArtistQuery from '../_query/useArtistQuery'
import useMarkMessageReadMutation from '../_query/useMarkMessageReadMutation'
import useMessageReplyQuery from '../_query/useMessageReplyQuery'
import useSendArtistReplyMutation from '../_query/useSendArtistReplyMutation'
import useReadWatermark from './useReadWatermark'
import useRoomChannel from './useRoomChannel'

// The studio reply room's data controller: paged history ∪ realtime (rr:) ∪ optimistic answers
// as one flat time-ordered timeline, plus read-marking and answering. The component owns only
// the view (selection, highlight, scroll) — mirrors useFanChatRoom's split.
export default function useReplyRoom(handle: string, messageId: string) {
  const [liveItems, setLiveItems] = useState<ChatReplyRoomItem[]>([])
  const [optimisticItems, setOptimisticItems] = useState<ChatReplyRoomItem[]>([])
  const { data: artistData } = useArtistQuery(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessageReplyQuery(handle, messageId)
  const { mutateAsync: markMessageRead } = useMarkMessageReadMutation(handle, messageId)
  const { mutateAsync: postAnswer, isPending: isAnswering } = useSendArtistReplyMutation(handle, messageId)

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false
  const fetched = data?.pages.flatMap((page) => page.items) ?? []
  const items = mergeById(fetched, [...liveItems, ...optimisticItems], (item) => item.messageId)
  const quotes = computeReplyRoomQuotes(items)
  const newestFanReplyId = items.findLast((item) => item.senderRole === 'fan')?.messageId

  async function sendAnswer(target: { fanId: number; replyMessageId: string }, text: string) {
    const { messageId: answerId } = await postAnswer({
      fanId: target.fanId,
      body: { contentType: 'text', text, quotedMessageId: target.replyMessageId },
    })

    setOptimisticItems(
      appendById<ChatReplyRoomItem>({
        messageId: answerId,
        senderRole: 'artist',
        fanId: target.fanId,
        quotedMessageId: target.replyMessageId,
        contentType: 'text',
        content: { text },
        createdAt: new Date().toISOString(),
      }),
    )
  }

  // Focused reply room (rr:, un-sampled): live fan replies to THIS message.
  useRoomChannel(artist && isOwner ? `rr:${artist.id}:${messageId}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'fanReply' || msg.contextMessageId !== messageId) {
        return
      }

      setLiveItems(
        appendById<ChatReplyRoomItem>({
          messageId: msg.messageId,
          senderRole: 'fan',
          fanId: msg.fanId,
          ...(msg.fan && { fan: { id: msg.fanId, nickname: msg.fan.nickname, imageURL: msg.fan.imageURL } }),
          ...(msg.quotedMessageId && { quotedMessageId: msg.quotedMessageId }),
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        }),
      )
    },
  })

  // Mark the room read up to the newest fan reply → clears the studio's unread badge and
  // surfaces as the fan's "읽음" receipt. Gated on tab visibility + throttled by the hook.
  useReadWatermark(newestFanReplyId, (lastReadMessageId) => markMessageRead({ lastReadMessageId }))

  return {
    items,
    quotes,
    isLoading: !data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sendAnswer,
    isAnswering,
  }
}
