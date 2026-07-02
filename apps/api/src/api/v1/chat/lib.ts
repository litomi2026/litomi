import type {
  ChatArtistBrief,
  ChatMessageContent,
  ChatMessageDTO,
  ChatMessagePreview,
  ChatReplyDTO,
  ChatSubscriptionDTO,
  POSTV1ChatMessageBody,
} from '@litomi/contracts'
import {
  type ChatArtistBriefRow,
  getChatArtistByHandle,
  hasActiveChatSubscription,
  listPaidIntervals,
  type PaidInterval,
} from '@litomi/db/app/query/chat'
import type { SubscriptionState } from '@litomi/db/app/query/subscription'
import { type ChatMessageRow, type ChatThreadRow, parseStreamId } from '@litomi/db/chat/query'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

export function mapMessage(row: ChatMessageRow): ChatMessageDTO {
  return {
    messageId: row.messageId,
    senderId: row.senderId,
    contentType: row.contentType as ChatMessageDTO['contentType'],
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

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

export function toSubscriptionDTO(sub: SubscriptionState): ChatSubscriptionDTO {
  return {
    status: sub.status,
    expiresAt: sub.expiresAt.toISOString(),
    autoRenew: sub.autoRenew,
  }
}

export function toContent(body: POSTV1ChatMessageBody): Record<string, unknown> {
  switch (body.contentType) {
    case 'text':
      return { text: body.text }
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

export type TimelineAccess =
  | { kind: 'entitled' }
  | {
      kind: 'lapsed'
      intervals: PaidInterval[]
    }
  | { kind: 'owner' }

export async function resolveTimelineAccess(
  userId: number,
  artist: { id: number; userId: number },
): Promise<TimelineAccess | undefined> {
  if (artist.userId === userId) {
    return { kind: 'owner' }
  }

  if (await hasActiveChatSubscription(userId, artist.id)) {
    return { kind: 'entitled' }
  }

  const intervals = await listPaidIntervals(userId, artist.id)
  return intervals.length > 0 ? { kind: 'lapsed', intervals } : undefined
}

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
