import {
  chatHandleParamSchema,
  type POSTV1ChatMessageResponse,
  PROBLEM,
  postV1ChatMessageBodySchema,
} from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { buildChatMessage, toBroadcastStreamId } from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', postV1ChatMessageBodySchema),
)

// Posts a broadcast message. Only the artist may post here; fans reply to a specific
// message via POST /artists/:handle/messages/:messageId/replies.
route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const body = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  if (!artist.isActive) {
    return problemResponse(c, { status: 403 })
  }

  if (artist.userId !== userId) {
    return problemResponse(c, { status: 403 })
  }

  const message = buildChatMessage({
    streamId: toBroadcastStreamId(artist.id),
    senderId: userId,
    contentType: body.contentType,
    content: { text: body.text },
  })

  try {
    await publishChatMessage({
      ...message,
      artistId: artist.id,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('chat message publish failed', error)
    return problemResponse(c, { problem: PROBLEM.MESSAGE_SEND_FAILED })
  }

  const response = {
    messageId: message.messageId,
  } satisfies POSTV1ChatMessageResponse

  return c.json(response, 202)
})

export default route
