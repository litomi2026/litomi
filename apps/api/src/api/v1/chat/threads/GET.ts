import type { ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import {
  type ChatCreatorBriefRow,
  listChatCreatorBriefs,
  listEntitledSubscriptionsOfUser,
  listSubscribedCreatorIds,
} from '@litomi/db/app/query/chat'
import {
  type ChatThreadRow,
  countUnreadByStreams,
  getReadCursors,
  getThreadSummaries,
  listFanReplyThreads,
  toBroadcastStreamId,
  toReplyStreamId,
  type UnreadFilter,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'

import { pickNewerSummary, threadPreview, toCreatorBrief } from '../lib'

const route = new Hono<Env>()

// A fan's chat list = (currently-entitled subscriptions) ∪ (creators they have past
// 1:1 history with). Lapsed threads stay visible read-only: their broadcast is hidden
// (lease) but the 1:1 conversation is perpetual. Both halves are small, so this is a
// handful of batched reads (summaries, watermarks, one unread query).
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  const [entitledCreators, fanReplyThreads, subscribedCreatorIds] = await Promise.all([
    listEntitledSubscriptionsOfUser(userId),
    listFanReplyThreads(userId),
    listSubscribedCreatorIds(userId),
  ])

  const entitledIds = new Set(entitledCreators.map((creator) => creator.id))
  // Each reply thread is the r:{C}:{me} summary for one creator.
  const replySummaryByCreator = new Map<number, ChatThreadRow>(
    fanReplyThreads.map((thread) => [thread.creatorId, thread]),
  )

  // Lapsed = anything the fan ever subscribed to (or has a 1:1 thread with) but isn't
  // currently entitled to. Fetch their briefs separately; they render read-only.
  const lapsedIds = [...new Set([...subscribedCreatorIds, ...replySummaryByCreator.keys()])].filter(
    (id) => !entitledIds.has(id),
  )
  const lapsedBriefs = await listChatCreatorBriefs(lapsedIds)

  const items: { brief: ChatCreatorBriefRow; entitled: boolean }[] = [
    ...entitledCreators.map((brief) => ({ brief, entitled: true })),
    ...lapsedIds.flatMap((id) => {
      const brief = lapsedBriefs.get(id)
      return brief ? [{ brief, entitled: false }] : []
    }),
  ]

  if (items.length === 0) {
    return c.json<GETV1ChatThreadsResponse>({ threads: [] }, { headers: { 'Cache-Control': privateCacheControl } })
  }

  // Broadcast summaries matter only for entitled creators (lease); the watermark —
  // stored under b:{C} for every creator — drives unread for both b and r.
  const entitledBroadcastIds = items.filter((item) => item.entitled).map((item) => toBroadcastStreamId(item.brief.id))
  const allBroadcastIds = items.map((item) => toBroadcastStreamId(item.brief.id))

  const [broadcastSummaries, watermarks] = await Promise.all([
    getThreadSummaries(entitledBroadcastIds),
    getReadCursors(userId, allBroadcastIds),
  ])

  const filters: UnreadFilter[] = []
  for (const { brief, entitled } of items) {
    const watermark = watermarks.get(toBroadcastStreamId(brief.id))

    if (entitled) {
      filters.push({
        streamId: toBroadcastStreamId(brief.id),
        sinceMessageId: watermark,
        excludeSenderId: userId,
      })
    }

    if (replySummaryByCreator.has(brief.id)) {
      filters.push({
        streamId: toReplyStreamId(brief.id, userId),
        sinceMessageId: watermark,
        excludeSenderId: userId,
      })
    }
  }

  const unreadByStream = await countUnreadByStreams(filters)

  const threads: ChatThreadListItem[] = items.map(({ brief, entitled }) => {
    const broadcastId = toBroadcastStreamId(brief.id)
    const replyId = toReplyStreamId(brief.id, userId)
    const broadcastSummary = entitled ? broadcastSummaries.get(broadcastId) : undefined
    const replySummary = replySummaryByCreator.get(brief.id)
    const latest = pickNewerSummary(broadcastSummary, replySummary)

    return {
      creator: toCreatorBrief(brief),
      entitled,
      lastMessage: latest ? threadPreview(latest) : null,
      unreadCount:
        (entitled ? (unreadByStream.get(broadcastId) ?? 0) : 0) +
        (replySummary ? (unreadByStream.get(replyId) ?? 0) : 0),
    }
  })

  // Most-recently-active first; creators with no messages yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  return c.json<GETV1ChatThreadsResponse>({ threads }, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
