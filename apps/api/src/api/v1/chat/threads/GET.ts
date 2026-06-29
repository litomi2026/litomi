import type { ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import {
  type ChatCreatorBriefRow,
  listChatCreatorBriefs,
  listEntitledSubscriptionsOfUser,
  listSubscribedCreatorIds,
} from '@litomi/db/app/query/chat'
import {
  countUnreadByStreams,
  getReadCursors,
  getThreadSummaries,
  toBroadcastStreamId,
  type UnreadFilter,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'

import { threadPreview, toCreatorBrief } from '../lib'

const route = new Hono<Env>()

// A fan's chat list = (currently-entitled subscriptions) ∪ (every creator they ever
// subscribed to). Entitled rows show the last broadcast + unread; lapsed rows stay
// reachable read-only (broadcast hidden, sending disabled) for the paid-window archive.
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  const [entitledCreators, subscribedCreatorIds] = await Promise.all([
    listEntitledSubscriptionsOfUser(userId),
    listSubscribedCreatorIds(userId),
  ])

  const entitledIds = new Set(entitledCreators.map((creator) => creator.id))
  const lapsedIds = subscribedCreatorIds.filter((id) => !entitledIds.has(id))
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

  // The broadcast summary + read watermark drive each entitled row's preview & unread.
  const entitledBroadcastIds = items.filter((item) => item.entitled).map((item) => toBroadcastStreamId(item.brief.id))

  const [summaries, watermarks] = await Promise.all([
    getThreadSummaries(entitledBroadcastIds),
    getReadCursors(userId, entitledBroadcastIds),
  ])

  const filters: UnreadFilter[] = entitledBroadcastIds.map((streamId) => ({
    streamId,
    sinceMessageId: watermarks.get(streamId),
    excludeSenderId: userId,
  }))

  const unreadByStream = await countUnreadByStreams(filters)

  const threads: ChatThreadListItem[] = items.map(({ brief, entitled }) => {
    const broadcastId = toBroadcastStreamId(brief.id)
    const summary = entitled ? summaries.get(broadcastId) : undefined

    return {
      creator: toCreatorBrief(brief),
      entitled,
      lastMessage: summary ? threadPreview(summary) : null,
      unreadCount: entitled ? (unreadByStream.get(broadcastId) ?? 0) : 0,
    }
  })

  // Most-recently-active first; creators with no broadcast yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  return c.json<GETV1ChatThreadsResponse>({ threads }, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
