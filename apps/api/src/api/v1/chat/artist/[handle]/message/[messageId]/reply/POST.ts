import { chatMessageParamSchema, type POSTV1ChatReplyResponse, postV1ChatReplyBodySchema } from '@litomi/contracts'
import { getChatArtistByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { buildChatMessage, chatMessageExists, toBroadcastStreamId, toMessageReplyStreamId } from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toContent } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatMessageParamSchema),
  zProblemValidator('json', postV1ChatReplyBodySchema),
)

// A fan replies to one specific message. The artist broadcasts (they never reply into a
// fan room), so the owner is rejected here. Requires a live subscription + a real message.
route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle, messageId } = c.req.valid('param')
  const body = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  if (!artist.isActive) {
    return problemResponse(c, { status: 403 })
  }

  if (artist.userId === userId) {
    return problemResponse(c, { status: 403 })
  }

  if (!(await hasActiveChatSubscription(userId, artist.id))) {
    return problemResponse(c, { status: 403 })
  }

  // The reply must target an existing message of this artist.
  if (!(await chatMessageExists(toBroadcastStreamId(artist.id), messageId))) {
    return problemResponse(c, { status: 404 })
  }

  const message = buildChatMessage({
    streamId: toMessageReplyStreamId(artist.id, messageId),
    senderId: userId,
    contentType: body.contentType,
    content: toContent(body),
  })

  try {
    await publishChatMessage({
      ...message,
      artistId: artist.id,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('chat reply publish failed', error)
    return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
  }

  return c.json<POSTV1ChatReplyResponse>({ messageId: message.messageId }, 202)
})

export default route
