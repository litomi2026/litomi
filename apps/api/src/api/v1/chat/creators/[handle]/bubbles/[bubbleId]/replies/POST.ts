import { chatBubbleParamSchema, type POSTV1ChatReplyResponse, postV1ChatReplyBodySchema } from '@litomi/contracts'
import { getChatCreatorByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { buildChatMessage, chatMessageExists, toBroadcastStreamId, toBubbleReplyStreamId } from '@litomi/db/chat/query'
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
  zProblemValidator('param', chatBubbleParamSchema),
  zProblemValidator('json', postV1ChatReplyBodySchema),
)

// A fan replies to one specific bubble. The creator broadcasts (they never reply into a
// fan room), so the owner is rejected here. Requires a live subscription + a real bubble.
route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle, bubbleId } = c.req.valid('param')
  const body = c.req.valid('json')
  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return problemResponse(c, { status: 404 })
  }

  if (!creator.isActive) {
    return problemResponse(c, { status: 403 })
  }

  if (creator.userId === userId) {
    return problemResponse(c, { status: 403 })
  }

  if (!(await hasActiveChatSubscription(userId, creator.id))) {
    return problemResponse(c, { status: 403 })
  }

  // The reply must target an existing bubble of this creator.
  if (!(await chatMessageExists(toBroadcastStreamId(creator.id), bubbleId))) {
    return problemResponse(c, { status: 404 })
  }

  const message = buildChatMessage({
    streamId: toBubbleReplyStreamId(creator.id, bubbleId),
    senderId: userId,
    contentType: body.contentType,
    content: toContent(body),
  })

  try {
    await publishChatMessage({
      ...message,
      creatorId: creator.id,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('chat reply publish failed', error)
    return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
  }

  return c.json<POSTV1ChatReplyResponse>({ messageId: message.messageId }, 202)
})

export default route
