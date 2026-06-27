import {
  type POSTV1ChatMessageBody,
  type POSTV1ChatMessageResponse,
  postV1ChatMessageBodySchema,
} from '@litomi/contracts'
import { getChatCreatorByUserId } from '@litomi/db/app/query/chat'
import { broadcastStreamId, buildChatMessage } from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/messages', requireAuth, zProblemValidator('json', postV1ChatMessageBodySchema), async (c) => {
  const userId = c.get('userId')!
  const body = c.req.valid('json')
  const creator = await getChatCreatorByUserId(userId)

  if (!creator) {
    return problemResponse(c, { status: 403 })
  }

  if (!creator.isActive) {
    return problemResponse(c, { status: 403 })
  }

  const message = buildChatMessage({
    streamId: broadcastStreamId(creator.id),
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
    console.error('chat broadcast publish failed', error)
    return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
  }

  return c.json<POSTV1ChatMessageResponse>({ messageId: message.messageId }, 202)
})

function toContent(body: POSTV1ChatMessageBody): Record<string, unknown> {
  switch (body.contentType) {
    case 'text':
      return {
        text: body.text,
      }
    case 'image':
      return {
        url: body.url,
        width: body.width,
        height: body.height,
      }
    case 'voice':
      return {
        url: body.url,
        durationMs: body.durationMs,
      }
    case 'video':
      return {
        url: body.url,
        durationMs: body.durationMs,
        width: body.width,
        height: body.height,
      }
  }
}

export default route
