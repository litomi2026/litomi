import {
  chatMessageParamSchema,
  type POSTV1ChatReplyResponse,
  PROBLEM,
  postV1ChatReplyBodySchema,
} from '@litomi/contracts'
import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import { buildChatMessage, getReplyGate, toMessageReplyStreamId } from '@litomi/db/chat/query'
import { REPLY_MAX_PER_MESSAGE, resolveReplyTextLimit } from '@litomi/domain/chat/policy'
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

  // 답장 자격과 길이 한도(연속 구독 보너스)는 같은 정본(paid invoice 구간)에서 나온다 —
  // 현재 결제 구간이 없으면 자격도 없다. 길이는 코드포인트 기준으로 센다.
  const intervals = await listPaidIntervals({
    userId,
    artistId: artist.id,
  })

  const maxTextLength = resolveReplyTextLimit(intervals, new Date())

  if (maxTextLength === undefined) {
    return problemResponse(c, { status: 403 })
  }

  if ([...body.text].length > maxTextLength) {
    return problemResponse(c, {
      problem: PROBLEM.REPLY_TOO_LONG,
      detail: `답장은 ${maxTextLength}자까지 보낼 수 있어요.`,
      extensions: { limit: maxTextLength },
    })
  }

  const gate = await getReplyGate({
    artistId: artist.id,
    messageId,
    senderId: userId,
  })

  // The reply must target an existing message of this artist.
  if (!gate) {
    return problemResponse(c, { status: 404 })
  }

  if (gate.ownReplyCount >= REPLY_MAX_PER_MESSAGE) {
    return problemResponse(c, {
      problem: PROBLEM.REPLY_LIMIT_REACHED,
      extensions: { limit: REPLY_MAX_PER_MESSAGE },
    })
  }

  const replyStreamId = toMessageReplyStreamId(artist.id, messageId)

  const message = buildChatMessage({
    streamId: replyStreamId,
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
    console.error('chat reply publish failed', error)
    return problemResponse(c, { problem: PROBLEM.MESSAGE_SEND_FAILED })
  }

  const response = {
    messageId: message.messageId,
  } satisfies POSTV1ChatReplyResponse

  return c.json(response, 202)
})

export default route
