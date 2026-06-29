import {
  type ChatReplyWithFan,
  chatBubbleParamSchema,
  type GETV1ChatRepliesResponse,
  getV1ChatRepliesQuerySchema,
} from '@litomi/contracts'
import { listUserBriefs } from '@litomi/db/app/query/chat'
import { listBubbleReplies } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { mapReply, requireOwnedCreator } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatBubbleParamSchema),
  zProblemValidator('query', getV1ChatRepliesQuerySchema),
)

// The creator reads ONE bubble's reply room: every fan's replies to it, newest-first,
// each tagged with the fan's brief. Owner-only.
route.get('/', ...middlewares, async (c) => {
  const { bubbleId } = c.req.valid('param')
  const { before, limit } = c.req.valid('query')
  const ownership = await requireOwnedCreator(c)

  if ('error' in ownership) {
    return ownership.error
  }

  const rows = await listBubbleReplies(ownership.creator.id, bubbleId, { before, limit })
  const fans = await listUserBriefs([...new Set(rows.map((row) => row.senderId))])

  const replies: ChatReplyWithFan[] = rows.map((row) => {
    const fan = fans.get(row.senderId)
    return {
      ...mapReply(row),
      ...(fan && {
        fan: {
          id: fan.id,
          nickname: fan.nickname,
          imageURL: fan.imageURL,
        },
      }),
    }
  })

  const result = {
    replies,
    nextCursor: rows.length === limit ? (rows.at(-1)?.messageId ?? null) : null,
  }

  return c.json<GETV1ChatRepliesResponse>(result, {
    headers: { 'Cache-Control': privateCacheControl },
  })
})

export default route
