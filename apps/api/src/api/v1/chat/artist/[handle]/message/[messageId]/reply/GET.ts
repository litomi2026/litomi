import {
  type ChatReplyRoomEntry,
  chatMessageParamSchema,
  type GETV1ChatRepliesResponse,
  getV1ChatRepliesQuerySchema,
} from '@litomi/contracts'
import { listUserBriefs } from '@litomi/db/app/query/chat'
import { type ChatDmMessageRow, listArtistAnswers, listFanRepliesToMessage } from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { zProblemValidator } from '@/utils/validator'

import { requireOwnedArtist } from '../../../../../access'
import { toReplyRoomMessage } from '../../../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatMessageParamSchema),
  zProblemValidator('query', getV1ChatRepliesQuerySchema),
)

// The artist reads ONE broadcast bubble's reply room: each fan's replies (newest-first), each
// tagged with the fan's brief, with the artist's own answers threaded under the reply they
// quote. Owner-only.
route.get('/', ...middlewares, async (c) => {
  const { messageId } = c.req.valid('param')
  const { before, limit } = c.req.valid('query')
  const ownership = await requireOwnedArtist(c)

  if ('error' in ownership) {
    return ownership.error
  }

  const artistId = ownership.artist.id
  const fanReplies = await listFanRepliesToMessage(artistId, messageId, { before, limit })

  const [fans, answers] = await Promise.all([
    listUserBriefs([...new Set(fanReplies.map((row) => row.fanId))]),
    listArtistAnswers(
      artistId,
      messageId,
      fanReplies.map((row) => row.messageId),
    ),
  ])

  // Group the artist's answers under the fan reply they quote.
  const answersByReply = new Map<string, ChatDmMessageRow[]>()

  for (const answer of answers) {
    if (!answer.quotedMessageId) {
      continue
    }

    const list = answersByReply.get(answer.quotedMessageId)

    if (list) {
      list.push(answer)
    } else {
      answersByReply.set(answer.quotedMessageId, [answer])
    }
  }

  const entries: ChatReplyRoomEntry[] = fanReplies.map((row) => {
    const fan = fans.get(row.fanId)
    return {
      fanId: row.fanId,
      reply: toReplyRoomMessage(row),
      fan: fan && {
        id: fan.id,
        nickname: fan.nickname,
        imageURL: fan.imageURL,
      },
      answers: (answersByReply.get(row.messageId) ?? []).map(toReplyRoomMessage),
    }
  })

  const response = {
    entries,
    nextCursor: fanReplies.length === limit ? fanReplies.at(-1)?.messageId : undefined,
  } satisfies GETV1ChatRepliesResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
