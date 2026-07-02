import type { ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import {
  type ChatArtistBriefRow,
  listChatArtistBriefs,
  listEntitledSubscriptionsOfUser,
  listSubscribedArtistIds,
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
import { noStoreCacheControl } from '@/utils/cache-control'

import { threadPreview, toArtistBrief } from '../lib'

const route = new Hono<Env>()

// A fan's chat list = (currently-entitled subscriptions) ∪ (every artist they ever
// subscribed to). Entitled rows show the last broadcast + unread; lapsed rows stay
// reachable read-only (broadcast hidden, sending disabled) for the paid-window archive.
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  const [entitledArtists, subscribedArtistIds] = await Promise.all([
    listEntitledSubscriptionsOfUser(userId),
    listSubscribedArtistIds(userId),
  ])

  const entitledIds = new Set(entitledArtists.map((artist) => artist.id))
  const lapsedIds = subscribedArtistIds.filter((id) => !entitledIds.has(id))
  const lapsedBriefs = await listChatArtistBriefs(lapsedIds)

  const items: { brief: ChatArtistBriefRow; entitled: boolean }[] = [
    ...entitledArtists.map((brief) => ({ brief, entitled: true })),
    ...lapsedIds.flatMap((id) => {
      const brief = lapsedBriefs.get(id)
      return brief ? [{ brief, entitled: false }] : []
    }),
  ]

  if (items.length === 0) {
    const response = { threads: [] } satisfies GETV1ChatThreadsResponse
    return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
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
      artist: toArtistBrief(brief),
      entitled,
      lastMessage: summary ? threadPreview(summary) : null,
      unreadCount: entitled ? (unreadByStream.get(broadcastId) ?? 0) : 0,
    }
  })

  // Most-recently-active first; artists with no broadcast yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  return c.json({ threads } satisfies GETV1ChatThreadsResponse, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
