import { chatMessageParamSchema, type GETV1ChatRepliesResponse, getV1ChatRepliesQuerySchema } from '@litomi/contracts'
import { listUserBriefs } from '@litomi/db/app/query/chat'
import { getReplyRoomMessagesByIds, listReplyRoomTimeline } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedArtist } from '../../../../../access'
import { toQuotedPreview, toReplyRoomItem } from '../../../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatMessageParamSchema),
  zProblemValidator('query', getV1ChatRepliesQuerySchema),
)

// The artist reads ONE broadcast bubble's reply room as a single flat timeline: every fan's
// replies and the artist's own answers, merged in messageId (time) order (newest-first pages).
// Quoted-message previews resolve in one batch; the client renders the quote only when the
// quoted message isn't visually adjacent. Owner-only.
route.get('/', ...middlewares, async (c) => {
  const { messageId } = c.req.valid('param')
  const { before, limit } = c.req.valid('query')
  const ownership = await requireOwnedArtist(c)

  if ('error' in ownership) {
    return ownership.error
  }

  const artistId = ownership.artist.id
  const rows = await listReplyRoomTimeline(artistId, messageId, { before, limit })
  const quotedIds = [...new Set(rows.filter((row) => row.quotedMessageId).map((row) => row.quotedMessageId!))]

  const [fans, quotedRows] = await Promise.all([
    listUserBriefs([...new Set(rows.map((row) => row.fanId))]),
    getReplyRoomMessagesByIds(artistId, messageId, quotedIds),
  ])

  const items = rows.map((row) => {
    const fan = fans.get(row.fanId)
    const quotedRow = row.quotedMessageId ? quotedRows.get(row.quotedMessageId) : undefined

    return toReplyRoomItem(
      row,
      fan && { id: fan.id, nickname: fan.nickname, imageURL: fan.imageURL },
      quotedRow && toQuotedPreview(quotedRow),
    )
  })

  const response = {
    items,
    nextCursor: rows.length === limit ? rows.at(-1)?.messageId : undefined,
  } satisfies GETV1ChatRepliesResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
