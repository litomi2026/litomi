import type {
  ChatBubbleDTO,
  ChatCreatorBrief,
  ChatMessageContent,
  ChatMessagePreview,
  ChatReplyDTO,
  POSTV1ChatMessageBody,
} from '@litomi/contracts'
import { type ChatCreatorBriefRow, getChatCreatorByHandle } from '@litomi/db/app/query/chat'
import { type ChatMessageRow, type ChatThreadRow, parseStreamId } from '@litomi/db/chat/query'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

// A broadcast row → the bubble DTO shown on the timeline.
export function mapBubble(row: ChatMessageRow): ChatBubbleDTO {
  return {
    messageId: row.messageId,
    senderId: row.senderId,
    contentType: row.contentType as ChatBubbleDTO['contentType'],
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

// A reply row (streamId = rb:{creatorId}:{bubbleId}) → the reply DTO. bubbleId is
// recovered from the streamId so callers don't have to thread it through.
export function mapReply(row: ChatMessageRow): ChatReplyDTO {
  const parsed = parseStreamId(row.streamId)
  return {
    messageId: row.messageId,
    bubbleId: parsed?.kind === 'reply' ? parsed.bubbleId : '',
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

export function toCreatorBrief(row: ChatCreatorBriefRow): ChatCreatorBrief {
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

// Resolves the handle param to a creator the caller OWNS, else a Problem response.
// Used by the creator-only reply-room read endpoints.
export async function requireOwnedCreator(c: Context<Env>) {
  const userId = c.get('userId')!
  const handle = c.req.param('handle')

  if (!handle) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  const creator = await getChatCreatorByHandle(handle)

  if (!creator) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  if (creator.userId !== userId) {
    return { error: problemResponse(c, { status: 403 }) }
  }

  return { creator }
}
