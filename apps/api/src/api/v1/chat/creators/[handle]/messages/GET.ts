import {
  type ChatReplyDTO,
  type ChatTimelineBubble,
  chatHandleParamSchema,
  type GETV1ChatMessagesResponse,
  getV1ChatMessagesQuerySchema,
} from '@litomi/contracts'
import { getChatCreatorByHandle, hasActiveChatSubscription, listPaidIntervals } from '@litomi/db/app/query/chat'
import {
  type ChatMessageRow,
  countUnreadByStreams,
  getReadCursors,
  listBroadcastBubbles,
  listOwnRepliesForBubbles,
  messageIdAtOrAfter,
  type TimelineWindow,
  toBubbleReplyStreamId,
  type UnreadFilter,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { mapBubble, mapReply } from '../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('query', getV1ChatMessagesQuerySchema),
)

// The timeline is the creator's broadcast feed (bubbles). Per bubble:
//   - fan view   → the fan's own replies + whether the creator has read them
//   - owner view → the bubble's unread reply count
// Access: owner / entitled fan → full broadcast; lapsed fan → broadcast sent during
// the windows they paid for; never-subscribed → 403.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { before, after, limit } = c.req.valid('query')
  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return problemResponse(c, { status: 404 })
  }

  const isOwner = creator.userId === userId
  let windows: TimelineWindow[] | undefined

  if (!isOwner && !(await hasActiveChatSubscription(userId, creator.id))) {
    const intervals = await listPaidIntervals(userId, creator.id)

    if (intervals.length === 0) {
      return problemResponse(c, { status: 403 })
    }

    windows = intervals.map((interval) => ({
      fromId: messageIdAtOrAfter(interval.startedAt),
      toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
    }))
  }

  const bubbles = await listBroadcastBubbles(creator.id, { windows, before, after, limit })
  const bubbleIds = bubbles.map((bubble) => bubble.messageId)

  const result = {
    bubbles: isOwner
      ? await buildOwnerBubbles(creator.id, userId, bubbles, bubbleIds)
      : await buildFanBubbles(creator.id, creator.userId, userId, bubbles, bubbleIds),
    nextCursor: bubbles.length === limit ? (bubbles.at(-1)?.messageId ?? null) : null,
  }

  return c.json<GETV1ChatMessagesResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
})

// Owner view: each bubble plus how many unread replies it has (one batched GROUP BY).
async function buildOwnerBubbles(
  creatorId: number,
  ownerUserId: number,
  bubbles: ChatMessageRow[],
  bubbleIds: string[],
): Promise<ChatTimelineBubble[]> {
  if (bubbleIds.length === 0) {
    return []
  }

  const cursors = await getReadCursors(
    ownerUserId,
    bubbleIds.map((bubbleId) => toBubbleReplyStreamId(creatorId, bubbleId)),
  )

  const filters: UnreadFilter[] = bubbleIds.map((bubbleId) => {
    const streamId = toBubbleReplyStreamId(creatorId, bubbleId)
    return { streamId, sinceMessageId: cursors.get(streamId), excludeSenderId: ownerUserId }
  })
  const unread = await countUnreadByStreams(filters)

  return bubbles.map((bubble) => ({
    bubble: mapBubble(bubble),
    unreadReplyCount: unread.get(toBubbleReplyStreamId(creatorId, bubble.messageId)) ?? 0,
  }))
}

// Fan view: each bubble plus the fan's own replies and whether the creator has read them.
async function buildFanBubbles(
  creatorId: number,
  creatorUserId: number,
  fanId: number,
  bubbles: ChatMessageRow[],
  bubbleIds: string[],
): Promise<ChatTimelineBubble[]> {
  if (bubbleIds.length === 0) {
    return []
  }

  const replyRows = await listOwnRepliesForBubbles(creatorId, fanId, bubbleIds)

  // Group the fan's replies by bubbleId (ascending messageId within a bubble).
  const repliesByBubble = new Map<string, ChatReplyDTO[]>()
  for (const row of replyRows) {
    const reply = mapReply(row)
    const list = repliesByBubble.get(reply.bubbleId)
    if (list) {
      list.push(reply)
    } else {
      repliesByBubble.set(reply.bubbleId, [reply])
    }
  }

  // Read the creator's reply-room cursor only for bubbles the fan actually replied to,
  // to tell whether their latest reply has been read (A · room-level read receipt).
  const repliedBubbleIds = [...repliesByBubble.keys()]
  const artistCursors = repliedBubbleIds.length
    ? await getReadCursors(
        creatorUserId,
        repliedBubbleIds.map((bubbleId) => toBubbleReplyStreamId(creatorId, bubbleId)),
      )
    : new Map<string, string>()

  return bubbles.map((bubble) => {
    const myReplies = repliesByBubble.get(bubble.messageId)

    if (!myReplies || myReplies.length === 0) {
      return { bubble: mapBubble(bubble) }
    }

    const lastOwnReplyId = myReplies[myReplies.length - 1].messageId
    const artistCursor = artistCursors.get(toBubbleReplyStreamId(creatorId, bubble.messageId))

    return {
      bubble: mapBubble(bubble),
      myReplies,
      artistReadMyReplies: artistCursor !== undefined && artistCursor >= lastOwnReplyId,
    }
  })
}

export default route
