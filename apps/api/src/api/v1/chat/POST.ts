import {
  type POSTV1ChatMessageBody,
  type POSTV1ChatMessageResponse,
  postV1ChatMessageBodySchema,
} from '@litomi/contracts'
import { getChatCreatorByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { broadcastStreamId, buildChatMessage, replyStreamId } from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post(
  '/creators/:handle/messages',
  requireAuth,
  zProblemValidator('json', postV1ChatMessageBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const handle = c.req.param('handle')
    const body = c.req.valid('json')
    const creator = await getChatCreatorByHandle(handle)

    if (!creator) {
      return problemResponse(c, { status: 404 })
    }

    if (!creator.isActive) {
      return problemResponse(c, { status: 403 })
    }

    let streamId: string

    if (creator.userId === userId) {
      streamId = broadcastStreamId(creator.id)
    } else {
      if (!(await hasActiveChatSubscription(userId, creator.id))) {
        return problemResponse(c, { status: 403 })
      }

      streamId = replyStreamId(creator.id, userId)
    }

    const message = buildChatMessage({
      streamId,
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
      console.error('chat message publish failed', error)
      return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
    }

    return c.json<POSTV1ChatMessageResponse>({ messageId: message.messageId }, 202)
  },
)

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
