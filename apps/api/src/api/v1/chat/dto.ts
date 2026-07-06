import type {
  ChatArtistBrief,
  ChatArtistMine,
  ChatContentType,
  ChatFeedItem,
  ChatMessageContent,
  ChatMessagePreview,
  ChatQuotedPreview,
  ChatReplyRoomMessage,
  ChatSenderRole,
  ChatSubscriptionDTO,
} from '@litomi/contracts'
import type { ChatArtistBriefRow, ChatArtistRow } from '@litomi/db/app/query/chat'
import type { SubscriptionState } from '@litomi/db/app/query/subscription'
import type { ChatBroadcastRow, ChatBroadcastSummaryRow, ChatDmMessageRow } from '@litomi/db/chat/query'

const QUOTE_PREVIEW_MAX = 80

function textOf(content: unknown): string {
  return (content as ChatMessageContent | null)?.text ?? ''
}

function truncate(text: string): string {
  return text.length > QUOTE_PREVIEW_MAX ? `${text.slice(0, QUOTE_PREVIEW_MAX)}…` : text
}

// A broadcast bubble as a fan-timeline item.
export function toBroadcastFeedItem(row: ChatBroadcastRow): ChatFeedItem {
  return {
    kind: 'broadcast',
    messageId: row.messageId,
    contentType: row.contentType as ChatContentType,
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }
}

// A 1:1 message as a fan-timeline item (fanReply for the fan's own, artistReply otherwise).
// `quoted` is the resolved preview of the answered message; the client shows it only when the
// quoted message isn't visually adjacent.
export function toDmFeedItem(row: ChatDmMessageRow, quoted?: ChatQuotedPreview): ChatFeedItem {
  const base = {
    messageId: row.messageId,
    contextMessageId: row.contextMessageId,
    ...(row.quotedMessageId && { quotedMessageId: row.quotedMessageId }),
    ...(quoted && { quoted }),
    contentType: row.contentType as ChatContentType,
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
  }

  return row.senderRole === 'artist' ? { kind: 'artistReply', ...base } : { kind: 'fanReply', ...base }
}

export function toReplyRoomMessage(row: ChatDmMessageRow): ChatReplyRoomMessage {
  return {
    messageId: row.messageId,
    contentType: row.contentType as ChatContentType,
    content: row.content as ChatMessageContent,
    createdAt: row.createdAt.toISOString(),
    ...(row.quotedMessageId && { quotedMessageId: row.quotedMessageId }),
  }
}

export function toQuotedPreview(row: ChatDmMessageRow): ChatQuotedPreview {
  return {
    messageId: row.messageId,
    senderRole: row.senderRole as ChatSenderRole,
    preview: truncate(textOf(row.content)),
  }
}

export function broadcastSummaryPreview(summary: ChatBroadcastSummaryRow): ChatMessagePreview {
  return {
    messageId: summary.lastMessageId,
    preview: summary.lastPreview,
    createdAt: summary.lastCreatedAt.toISOString(),
  }
}

export function dmPreview(row: ChatDmMessageRow): ChatMessagePreview {
  return {
    messageId: row.messageId,
    preview: truncate(textOf(row.content)),
    createdAt: row.createdAt.toISOString(),
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

// 스튜디오 응답용 — DB 행에서 userId·타임스탬프를 떼고 계약 형태로 좁힌다.
export function toChatArtistMine(row: ChatArtistRow): ChatArtistMine {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    description: row.description,
    imageURL: row.imageURL,
    emoji: row.emoji,
    priceAmount: row.priceAmount,
    priceCurrency: row.priceCurrency,
    isActive: row.isActive,
  }
}

export function toSubscriptionDTO(sub: SubscriptionState): ChatSubscriptionDTO {
  return {
    status: sub.status,
    expiresAt: sub.expiresAt.toISOString(),
    autoRenew: sub.autoRenew,
  }
}
