import type { ChatMessagePreview, ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import { listChatThreadArtists } from '@litomi/db/app/query/chat'
import {
  countBroadcastUnread,
  countDmUnread,
  getBroadcastSummaries,
  getLatestArtistDmPerArtist,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

import { broadcastSummaryPreview, dmPreview, toArtistBrief } from '../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

// A fan's chat list = every artist they ever subscribed to. Broadcast preview/unread show only
// while entitled (lapsed rows hide the broadcast archive), but the 1:1 history is always
// readable, so the artist's latest 1:1 answer + its unread count show regardless. The row's
// last message is whichever is newer.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const artists = await listChatThreadArtists(userId)

  if (artists.length === 0) {
    return c.json({ threads: [] } satisfies GETV1ChatThreadsResponse, {
      headers: { 'Cache-Control': noStoreCacheControl },
    })
  }

  const artistIds = artists.map((artist) => artist.id)
  const entitledIds = artists.filter((artist) => artist.entitled).map((artist) => artist.id)

  const [summaries, broadcastUnread, dmUnread, latestDm] = await Promise.all([
    getBroadcastSummaries(entitledIds),
    countBroadcastUnread(userId, entitledIds),
    countDmUnread(userId, artistIds),
    getLatestArtistDmPerArtist(userId, artistIds),
  ])

  const threads: ChatThreadListItem[] = artists.map(({ entitled, ...brief }) => {
    const summary = entitled ? summaries.get(brief.id) : undefined
    const dm = latestDm.get(brief.id)

    return {
      artist: toArtistBrief(brief),
      entitled,
      lastMessage: pickLatest(summary && broadcastSummaryPreview(summary), dm && dmPreview(dm)),
      unreadCount: (entitled ? (broadcastUnread.get(brief.id) ?? 0) : 0) + (dmUnread.get(brief.id) ?? 0),
    }
  })

  // Most-recently-active first; artists with no activity yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  return c.json({ threads } satisfies GETV1ChatThreadsResponse, {
    headers: { 'Cache-Control': noStoreCacheControl },
  })
})

function pickLatest(a?: ChatMessagePreview, b?: ChatMessagePreview): ChatMessagePreview | undefined {
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  return a.messageId >= b.messageId ? a : b
}

export default route
