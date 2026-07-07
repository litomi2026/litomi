import type { ChatMessagePreview, ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import { listChatThreadArtists, listPaidIntervalsByArtist } from '@litomi/db/app/query/chat'
import {
  type ArtistBroadcastWindows,
  countBroadcastUnread,
  countDmUnread,
  getLatestArtistDmPerArtist,
  getLatestBroadcastPerArtist,
  messageIdAtOrAfter,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

import { broadcastPreview, dmPreview, toArtistBrief } from '../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

// A fan's chat list = every artist they ever subscribed to. The broadcast preview/unread are
// scoped to the windows the fan paid for (same access rule as the timeline — pre-subscription and
// gap-period broadcasts never show), while the 1:1 history is always readable, so the artist's
// latest 1:1 answer + its unread count show regardless. The row's last message is whichever is newer.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const artists = await listChatThreadArtists(userId)

  if (artists.length === 0) {
    return c.json({ threads: [] } satisfies GETV1ChatThreadsResponse, {
      headers: { 'Cache-Control': noStoreCacheControl },
    })
  }

  const artistIds = artists.map((artist) => artist.id)
  const intervalsByArtist = await listPaidIntervalsByArtist(userId, artistIds)

  // Turn each artist's paid intervals into messageId windows — the broadcast preview/unread only
  // see broadcasts inside them. A current interval's expiresAt is in the future, so it naturally
  // covers the ongoing period's broadcasts.
  const broadcastWindows: ArtistBroadcastWindows[] = artists.map((artist) => ({
    artistId: artist.id,
    windows: (intervalsByArtist.get(artist.id) ?? []).map((interval) => ({
      fromId: messageIdAtOrAfter(interval.startedAt),
      toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
    })),
  }))

  const [previews, broadcastUnread, dmUnread, latestDm] = await Promise.all([
    getLatestBroadcastPerArtist(broadcastWindows),
    countBroadcastUnread(userId, broadcastWindows),
    countDmUnread(userId, artistIds),
    getLatestArtistDmPerArtist(userId, artistIds),
  ])

  const threads: ChatThreadListItem[] = artists.map(({ entitled, ...brief }) => {
    const preview = previews.get(brief.id)
    const dm = latestDm.get(brief.id)

    return {
      artist: toArtistBrief(brief),
      entitled,
      lastMessage: pickLatest(preview && broadcastPreview(preview), dm && dmPreview(dm)),
      unreadCount: (broadcastUnread.get(brief.id) ?? 0) + (dmUnread.get(brief.id) ?? 0),
    }
  })

  // Most-recently-active first; artists with no activity yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  const response = {
    threads,
  } satisfies GETV1ChatThreadsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
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
