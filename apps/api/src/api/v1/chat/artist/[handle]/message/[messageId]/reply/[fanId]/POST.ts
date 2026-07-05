import {
  chatArtistReplyParamSchema,
  type POSTV1ArtistReplyResponse,
  PROBLEM,
  postV1ArtistReplyBodySchema,
} from '@litomi/contracts'
import { buildDmMessage, getDmMessagesByIds } from '@litomi/db/chat/query'
import { publishChatDirectMessage } from '@litomi/events'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedArtist } from '../../../../../../access'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatArtistReplyParamSchema),
  zProblemValidator('json', postV1ArtistReplyBodySchema),
)

// The artist answers ONE fan's reply, privately. Owner-only. The answer is anchored to the
// same broadcast bubble (messageId = context) and quotes the fan's message (quotedMessageId),
// which must be a real message this fan sent in this conversation. Only that fan ever sees it.
route.post('/', ...middlewares, async (c) => {
  const { messageId, fanId } = c.req.valid('param')
  const body = c.req.valid('json')
  const ownership = await requireOwnedArtist(c)

  if ('error' in ownership) {
    return ownership.error
  }

  const { artist } = ownership

  if (!artist.isActive) {
    return problemResponse(c, { status: 403 })
  }

  // 인용 대상은 이 팬이 이 대화(같은 context 말풍선)에서 실제로 보낸 메시지여야 한다 —
  // fanId ↔ quotedMessageId 정합성을 이 조회가 함께 검증한다.
  const quoted = (await getDmMessagesByIds(artist.id, fanId, [body.quotedMessageId])).get(body.quotedMessageId)

  if (!quoted || quoted.contextMessageId !== messageId) {
    return problemResponse(c, { status: 404 })
  }

  const message = buildDmMessage({
    artistId: artist.id,
    fanId,
    contextMessageId: messageId,
    senderRole: 'artist',
    quotedMessageId: body.quotedMessageId,
    contentType: body.contentType,
    content: { text: body.text },
  })

  try {
    await publishChatDirectMessage({
      kind: 'dm',
      artistId: artist.id,
      fanId,
      contextMessageId: messageId,
      messageId: message.messageId,
      senderRole: 'artist',
      quotedMessageId: message.quotedMessageId,
      contentType: message.contentType,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('chat artist reply publish failed', error)
    return problemResponse(c, { problem: PROBLEM.MESSAGE_SEND_FAILED })
  }

  const response = {
    messageId: message.messageId,
  } satisfies POSTV1ArtistReplyResponse

  return c.json(response, 202)
})

export default route
