import type {
  ChatArtistBrief,
  ChatArtistMine,
  ChatMessageContent,
  ChatMessageDTO,
  ChatMessagePreview,
  ChatReplyDTO,
  ChatSubscriptionDTO,
} from '@litomi/contracts'
import type { ChatArtistBriefRow, ChatArtistRow } from '@litomi/db/app/query/chat'
import type { SubscriptionState } from '@litomi/db/app/query/subscription'
import { type ChatMessageRow, type ChatThreadRow, parseStreamId } from '@litomi/db/chat/query'

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
