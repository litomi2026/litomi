import { chatMessageParamSchema, type POSTV1ChatReplyResponse, postV1ChatReplyBodySchema } from '@litomi/contracts'
import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import {
  buildChatMessage,
  chatMessageExists,
  countOwnReplies,
  toBroadcastStreamId,
  toMessageReplyStreamId,
} from '@litomi/db/chat/query'
import { publishChatMessage } from '@litomi/events'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { resolveReplyLimit } from '../../../../../lib'

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

  // 답장 자격과 한도(연속 구독 보너스)는 같은 정본(paid invoice 구간)에서 나온다 —
  // 현재 결제 구간이 없으면 한도도 없다. 길이는 코드포인트 기준으로 센다.
  const limit = resolveReplyLimit(await listPaidIntervals(userId, artist.id), new Date())

  if (!limit) {
    return problemResponse(c, { status: 403 })
  }

  if ([...body.text].length > limit.maxTextLength) {
    return problemResponse(c, {
      status: 403,
      detail: `답장은 ${limit.maxTextLength}자까지 보낼 수 있어요.`,
    })
  }

  if (!(await chatMessageExists(toBroadcastStreamId(artist.id), messageId))) {
    return problemResponse(c, { status: 404 })
  }

  const replyStreamId = toMessageReplyStreamId(artist.id, messageId)

  if ((await countOwnReplies(replyStreamId, userId)) >= limit.maxRepliesPerMessage) {
    return problemResponse(c, {
      status: 403,
      detail: `이 메시지에는 답장을 ${limit.maxRepliesPerMessage}회까지 보낼 수 있어요.`,
    })
  }

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
    return problemResponse(c, { status: 503, detail: '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.' })
  }

  const response = {
    messageId: message.messageId,
  } satisfies POSTV1ChatReplyResponse

  return c.json(response, 202)
})

export default route
