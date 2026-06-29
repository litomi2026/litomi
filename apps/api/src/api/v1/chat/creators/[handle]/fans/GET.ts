import {
  type ChatInboxItem,
  chatHandleParamSchema,
  type GETV1ChatInboxResponse,
  getV1ChatInboxQuerySchema,
} from '@litomi/contracts'
import { listUserBriefs } from '@litomi/db/app/query/chat'
import { countUnreadByStreams, getReadCursors, listInboxThreads } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedCreator, threadPreview } from '../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('query', getV1ChatInboxQuerySchema),
)

// The creator's inbox: one row per fan reply thread, most-recently-active first.
route.get('/', ...middlewares, async (c) => {
  const owned = await requireOwnedCreator(c)

  if ('error' in owned) {
    return owned.error
  }

  const { before, limit } = c.req.valid('query')
  const ownerUserId = c.get('userId')!
  const rows = await listInboxThreads(owned.creator.id, { before, limit })

  const nextCursor = rows.length === limit ? rows[rows.length - 1]?.lastMessageId : undefined
  const fanIds = rows.flatMap((row) => (row.fanId === null ? [] : [row.fanId]))
  const streamIds = rows.map((row) => row.streamId)

  const [fanBriefs, cursors] = await Promise.all([listUserBriefs(fanIds), getReadCursors(ownerUserId, streamIds)])

  const unreadByStream = await countUnreadByStreams(
    rows.map((row) => ({
      streamId: row.streamId,
      sinceMessageId: cursors.get(row.streamId),
      excludeSenderId: ownerUserId,
    })),
  )

  const threads: ChatInboxItem[] = rows.flatMap((row) => {
    if (row.fanId === null) {
      return []
    }

    return [
      {
        fanId: row.fanId,
        fan: fanBriefs.get(row.fanId),
        lastMessage: threadPreview(row),
        unreadCount: unreadByStream.get(row.streamId) ?? 0,
      },
    ]
  })

  return c.json<GETV1ChatInboxResponse>({ threads, nextCursor }, { headers: { 'Cache-Control': privateCacheControl } })
})

export default route
