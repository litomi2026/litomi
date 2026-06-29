import type {
  ChatArtistBrief,
  ChatMessageContent,
  ChatMessageDTO,
  ChatMessagePreview,
  ChatReplyDTO,
  POSTV1ChatMessageBody,
} from '@litomi/contracts'
import { type ChatArtistBriefRow, getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { type ChatMessageRow, type ChatThreadRow, parseStreamId } from '@litomi/db/chat/query'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

// A broadcast row → the message DTO shown on the timeline.
export function mapMessage(row: ChatMessageRow): ChatMessageDTO {
  return {
    messageId: row.messageId,
    senderId: row.senderId,
    contentType: row.contentType as ChatMessageDTO['contentType'],
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

// A reply row (streamId = rb:{artistId}:{messageId}) → the reply DTO. messageId is
// recovered from the streamId so callers don't have to thread it through.
export function mapReply(row: ChatMessageRow): ChatReplyDTO {
  const parsed = parseStreamId(row.streamId)
  return {
    messageId: row.messageId,
    targetMessageId: parsed?.kind === 'reply' ? parsed.messageId : '',
    senderId: row.senderId,
    contentType: row.contentType as ChatReplyDTO['contentType'],
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

// The chat list renders from the denormalized broadcast summary, never message bodies.
export function threadPreview(summary: ChatThreadRow): ChatMessagePreview {
  return {
    messageId: summary.lastMessageId,
    senderId: summary.lastSenderId,
    contentType: summary.lastContentType as ChatMessagePreview['contentType'],
    preview: summary.lastPreview,
    createdAt: summary.lastCreatedAt.toISOString(),
  }
}

export function toArtistBrief(row: ChatArtistBriefRow): ChatArtistBrief {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    imageURL: row.imageURL,
    emoji: row.emoji,
  }
}

// Maps a validated send body to the JSON content persisted for that message kind.
export function toContent(body: POSTV1ChatMessageBody): Record<string, unknown> {
  switch (body.contentType) {
    case 'text':
      return { text: body.text }
    case 'image':
      return { url: body.url, width: body.width, height: body.height }
    case 'voice':
      return { url: body.url, durationMs: body.durationMs }
    case 'video':
      return { url: body.url, durationMs: body.durationMs, width: body.width, height: body.height }
  }
}

// Resolves the handle param to a artist the caller OWNS, else a Problem response.
// Used by the artist-only reply-room read endpoints.
export async function requireOwnedArtist(c: Context<Env>) {
  const userId = c.get('userId')!
  const handle = c.req.param('handle')

  if (!handle) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  if (artist.userId !== userId) {
    return { error: problemResponse(c, { status: 403 }) }
  }

  return { artist }
}
