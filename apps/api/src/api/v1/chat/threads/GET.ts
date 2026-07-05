import type { ChatThreadListItem, GETV1ChatThreadsResponse } from '@litomi/contracts'
import { listChatThreadArtists } from '@litomi/db/app/query/chat'
import { countUnreadByStreams, getThreadSummaries, toBroadcastStreamId } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'

import { threadPreview, toArtistBrief } from '../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

// A fan's chat list = every artist they ever subscribed to. Entitled rows show the last
// broadcast + unread; lapsed rows stay reachable read-only (broadcast hidden, sending
// disabled) for the paid-window archive.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const artists = await listChatThreadArtists(userId)

  if (artists.length === 0) {
    const response = {
      threads: [],
    } satisfies GETV1ChatThreadsResponse

    return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
  }

  // The broadcast summary + read watermark drive each entitled row's preview & unread.
  const entitledBroadcastIds = artists
    .filter((artist) => artist.entitled)
    .map((artist) => toBroadcastStreamId(artist.id))

  const [summaries, unreadByStream] = await Promise.all([
    getThreadSummaries(entitledBroadcastIds),
    countUnreadByStreams(userId, entitledBroadcastIds),
  ])

  const threads: ChatThreadListItem[] = artists.map(({ entitled, ...brief }) => {
    const broadcastId = toBroadcastStreamId(brief.id)
    const summary = entitled ? summaries.get(broadcastId) : undefined

    return {
      artist: toArtistBrief(brief),
      entitled,
      lastMessage: summary && threadPreview(summary),
      unreadCount: entitled ? (unreadByStream.get(broadcastId) ?? 0) : 0,
    }
  })

  // Most-recently-active first; artists with no broadcast yet sink to the bottom.
  threads.sort((a, b) => (b.lastMessage?.messageId ?? '').localeCompare(a.lastMessage?.messageId ?? ''))

  const response = {
    threads,
  } satisfies GETV1ChatThreadsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
