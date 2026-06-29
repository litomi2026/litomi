import { chatFanIdParamSchema, type POSTV1ChatReplyResponse, postV1ChatReplyBodySchema } from '@litomi/contracts'
import { hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { buildChatMessage, toReplyStreamId } from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedCreator, toContent } from '../../../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const handlers = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatFanIdParamSchema),
  zProblemValidator('json', postV1ChatReplyBodySchema),
)

route.post('/', ...handlers, async (c) => {
  const { fanId } = c.req.valid('param')
  const body = c.req.valid('json')
  const userId = c.get('userId')!
  const owned = await requireOwnedCreator(c)

  if ('error' in owned) {
    return owned.error
  }

  if (!owned.creator.isActive) {
    return problemResponse(c, { status: 403 })
  }

  if (!(await hasActiveChatSubscription(fanId, owned.creator.id))) {
    return problemResponse(c, { status: 403 })
  }

  const message = buildChatMessage({
    streamId: toReplyStreamId(owned.creator.id, fanId),
    senderId: userId,
    contentType: body.contentType,
    content: toContent(body),
  })

  try {
    await publishChatMessage({
      ...message,
      creatorId: owned.creator.id,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('chat reply publish failed', error)
    return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
  }

  return c.json<POSTV1ChatReplyResponse>({ messageId: message.messageId }, 202)
})

export default route
