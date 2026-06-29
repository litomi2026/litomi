import type {
  ChatCreatorBrief,
  ChatMessageContent,
  ChatMessageDTO,
  ChatMessagePreview,
  POSTV1ChatMessageBody,
} from '@litomi/contracts'
import { type ChatCreatorBriefRow, getChatCreatorByHandle } from '@litomi/db/app/query/chat'
import { type ChatMessageRow, type ChatThreadRow, getKindFromStreamId } from '@litomi/db/chat/query'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

export function mapMessageRow(row: ChatMessageRow): ChatMessageDTO {
  return {
    messageId: row.messageId,
    streamId: row.streamId,
    senderId: row.senderId,
    kind: getKindFromStreamId(row.streamId),
    contentType: row.contentType as ChatMessageDTO['contentType'],
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

// The chat list & inbox render from the denormalized summary row, never from message bodies.
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

// Newer of two stream summaries by ULID (lexicographic order == chronological order).
export function pickNewerSummary(
  a: ChatThreadRow | undefined,
  b: ChatThreadRow | undefined,
): ChatThreadRow | undefined {
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  return a.lastMessageId >= b.lastMessageId ? a : b
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
