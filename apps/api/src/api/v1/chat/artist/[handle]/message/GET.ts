import {
  type ChatReplyDTO,
  type ChatTimelineMessage,
  chatHandleParamSchema,
  type GETV1ChatMessagesResponse,
  getV1ChatMessagesQuerySchema,
} from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import {
  type ChatMessageRow,
  countUnreadByStreams,
  getReadCursors,
  listBroadcastMessages,
  listOwnRepliesForMessages,
  messageIdAtOrAfter,
  type TimelineWindow,
  toMessageReplyStreamId,
} from '@litomi/db/chat/query'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { resolveTimelineAccess } from '../../../access'
import { mapMessage, mapReply } from '../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('query', getV1ChatMessagesQuerySchema),
)

// The timeline is the artist's broadcast feed (messages). Per message:
//   - fan view   → the fan's own replies + whether the artist has read them
//   - owner view → the message's unread reply count
// Access: owner / entitled fan → full broadcast; lapsed fan → broadcast sent during
// the windows they paid for; never-subscribed → 403.
route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { before, after, limit } = c.req.valid('query')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const access = await resolveTimelineAccess(userId, artist)

  if (!access) {
    return problemResponse(c, { status: 403 })
  }

  const windows: TimelineWindow[] | undefined =
    access.kind === 'lapsed'
      ? access.intervals.map((interval) => ({
          fromId: messageIdAtOrAfter(interval.startedAt),
          toIdExclusive: messageIdAtOrAfter(interval.expiresAt),
        }))
      : undefined

  const messages = await listBroadcastMessages(artist.id, { windows, before, after, limit })
  const messageIds = messages.map((message) => message.messageId)
  const isOwner = access.kind === 'owner'

  const result = {
    messages: isOwner
      ? await buildOwnerMessages(artist.id, userId, messages, messageIds)
      : await buildFanMessages(artist.id, artist.userId, userId, messages, messageIds),
    nextCursor: messages.length === limit ? messages.at(-1)?.messageId : null,
  } satisfies GETV1ChatMessagesResponse

  return c.json(result, { headers: { 'Cache-Control': noStoreCacheControl } })
})

// Owner view: each message plus how many unread replies it has (one batched GROUP BY).
async function buildOwnerMessages(
  artistId: number,
  ownerUserId: number,
  messages: ChatMessageRow[],
  messageIds: string[],
): Promise<ChatTimelineMessage[]> {
  if (messageIds.length === 0) {
    return []
  }

  const unread = await countUnreadByStreams(
    ownerUserId,
    messageIds.map((messageId) => toMessageReplyStreamId(artistId, messageId)),
  )

  return messages.map((message) => ({
    message: mapMessage(message),
    unreadReplyCount: unread.get(toMessageReplyStreamId(artistId, message.messageId)) ?? 0,
  }))
}

// Fan view: each message plus the fan's own replies and whether the artist has read them.
// artistUserId null = 탈퇴한 아티스트의 아카이브 — 읽음 커서가 파기되어 읽음 표시는 생략된다.
async function buildFanMessages(
  artistId: number,
  artistUserId: number | null,
  fanId: number,
  messages: ChatMessageRow[],
  messageIds: string[],
): Promise<ChatTimelineMessage[]> {
  if (messageIds.length === 0) {
    return []
  }

  const replyRows = await listOwnRepliesForMessages(artistId, fanId, messageIds)

  // Group the fan's replies by the message they target (NOT the reply's own id), so a
  // message's myReplies can be looked up by message.messageId below.
  const repliesByMessage = new Map<string, ChatReplyDTO[]>()
  for (const row of replyRows) {
    const reply = mapReply(row)
    const list = repliesByMessage.get(reply.targetMessageId)
    if (list) {
      list.push(reply)
    } else {
      repliesByMessage.set(reply.targetMessageId, [reply])
    }
  }

  // Read the artist's reply-room cursor only for messages the fan actually replied to,
  // to tell whether their latest reply has been read (A · room-level read receipt).
  const repliedMessageIds = [...repliesByMessage.keys()]
  const artistCursors =
    repliedMessageIds.length && artistUserId !== null
      ? await getReadCursors(
          artistUserId,
          repliedMessageIds.map((messageId) => toMessageReplyStreamId(artistId, messageId)),
        )
      : new Map<string, string>()

  return messages.map((message) => {
    const myReplies = repliesByMessage.get(message.messageId)

    if (!myReplies || myReplies.length === 0) {
      return { message: mapMessage(message) }
    }

    const lastOwnReplyId = myReplies[myReplies.length - 1].messageId
    const artistCursor = artistCursors.get(toMessageReplyStreamId(artistId, message.messageId))

    return {
      message: mapMessage(message),
      myReplies,
      artistReadMyReplies: artistCursor !== undefined && artistCursor >= lastOwnReplyId,
    }
  })
}

export default route
