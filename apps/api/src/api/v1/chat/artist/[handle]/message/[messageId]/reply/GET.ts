import {
  type ChatReplyWithFan,
  chatMessageParamSchema,
  type GETV1ChatRepliesResponse,
  getV1ChatRepliesQuerySchema,
} from '@litomi/contracts'
import { listUserBriefs } from '@litomi/db/app/query/chat'
import { listMessageReplies } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedArtist } from '../../../../../access'
import { mapReply } from '../../../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatMessageParamSchema),
  zProblemValidator('query', getV1ChatRepliesQuerySchema),
)

// The artist reads ONE message's reply room: every fan's replies to it, newest-first,
// each tagged with the fan's brief. Owner-only.
route.get('/', ...middlewares, async (c) => {
  const { messageId } = c.req.valid('param')
  const { before, limit } = c.req.valid('query')
  const ownership = await requireOwnedArtist(c)

  if ('error' in ownership) {
    return ownership.error
  }

  const rows = await listMessageReplies(ownership.artist.id, messageId, { before, limit })
  const fans = await listUserBriefs([...new Set(rows.map((row) => row.senderId))])

  const replies: ChatReplyWithFan[] = rows.map((row) => {
    const fan = fans.get(row.senderId)
    return {
      ...mapReply(row),
      fan: fan && {
        id: fan.id,
        nickname: fan.nickname,
        imageURL: fan.imageURL,
      },
    }
  })

  const response = {
    replies,
    nextCursor: rows.length === limit ? rows.at(-1)?.messageId : undefined,
  } satisfies GETV1ChatRepliesResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
