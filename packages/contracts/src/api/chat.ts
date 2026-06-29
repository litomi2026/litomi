import { z } from 'zod'

export const CHAT_TEXT_MAX_LENGTH = 2000
export const CHAT_MEDIA_URL_MAX_LENGTH = 2048

export const chatContentTypeSchema = z.enum(['text', 'image', 'voice', 'video'])
export type ChatContentType = z.infer<typeof chatContentTypeSchema>

const MESSAGE_ID_MAX_LENGTH = 26 // ULID
const messageIdCursorSchema = z.string().min(1).max(MESSAGE_ID_MAX_LENGTH)

export const chatHandleParamSchema = z.object({
  handle: z.string().min(1),
})

export type ChatHandleParam = z.infer<typeof chatHandleParamSchema>

// A message (broadcast message) is addressed by its messageId (a ULID).
export const chatMessageParamSchema = z.object({
  handle: z.string().min(1),
  messageId: z.string().min(1).max(MESSAGE_ID_MAX_LENGTH),
})

export type ChatMessageParam = z.infer<typeof chatMessageParamSchema>

const mediaUrlSchema = z.url().max(CHAT_MEDIA_URL_MAX_LENGTH)

// Shared content shapes — a broadcast message and a fan reply carry the same payloads.
export const postV1ChatMessageBodySchema = z.discriminatedUnion('contentType', [
  z.object({ contentType: z.literal('text'), text: z.string().trim().min(1).max(CHAT_TEXT_MAX_LENGTH) }),
  z.object({
    contentType: z.literal('image'),
    url: mediaUrlSchema,
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
  z.object({
    contentType: z.literal('voice'),
    url: mediaUrlSchema,
    durationMs: z.number().int().positive().optional(),
  }),
  z.object({
    contentType: z.literal('video'),
    url: mediaUrlSchema,
    durationMs: z.number().int().positive().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
])

export type POSTV1ChatMessageBody = z.infer<typeof postV1ChatMessageBodySchema>

export const postV1ChatMessageResponseSchema = z.object({
  messageId: z.string(),
})

export type POSTV1ChatMessageResponse = z.infer<typeof postV1ChatMessageResponseSchema>

// A fan's reply uses the same content shapes as a message.
export const postV1ChatReplyBodySchema = postV1ChatMessageBodySchema
export type POSTV1ChatReplyBody = POSTV1ChatMessageBody
export type POSTV1ChatReplyResponse = POSTV1ChatMessageResponse

// --- Shared DTOs --------------------------------------------------------------

export type ChatMessageContent =
  | { text: string }
  | { url: string; width?: number; height?: number }
  | { url: string; durationMs?: number }
  | { url: string; durationMs?: number; width?: number; height?: number }

// Realtime relay envelope (Valkey → gateway → client). For a reply the client derives
// messageId from streamId (`rb:{artistId}:{messageId}`).
export interface ChatRelayMessageDTO {
  messageId: string
  streamId: string
  senderId: number
  kind: 'broadcast' | 'reply'
  contentType: ChatContentType
  content: ChatMessageContent
  createdAt: string
}

// A broadcast message as seen on the timeline.
export interface ChatMessageDTO {
  messageId: string
  senderId: number
  contentType: ChatContentType
  content: ChatMessageContent
  createdAt: string
}

// A fan's reply to a specific message.
export interface ChatReplyDTO {
  messageId: string
  targetMessageId: string
  senderId: number
  contentType: ChatContentType
  content: ChatMessageContent
  createdAt: string
}

export interface ChatMessagePreview {
  messageId: string
  senderId: number
  contentType: ChatContentType
  preview: string
  createdAt: string
}

export interface ChatArtistBrief {
  id: number
  handle: string
  displayName: string
  imageURL: string | null
  emoji: string | null
}

export interface ChatUserBrief {
  id: number
  nickname: string
  imageURL: string | null
}

// --- Timeline (message-centric) ------------------------------------------------

export const getV1ChatMessagesQuerySchema = z.object({
  // Page backwards in time (older than this messageId) — the default scroll-up behavior.
  before: messageIdCursorSchema.optional(),
  // Page/sync forwards in time (newer than this messageId), e.g. after a reconnect.
  after: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export type GETV1ChatMessagesQuery = z.infer<typeof getV1ChatMessagesQuerySchema>

// One message on the timeline. Role-specific fields:
//   - fan:   myReplies + artistReadMyReplies (whether the artist has read them)
//   - owner: unreadReplyCount (new replies on this message, capped)
export interface ChatTimelineMessage {
  message: ChatMessageDTO
  myReplies?: ChatReplyDTO[]
  artistReadMyReplies?: boolean
  unreadReplyCount?: number
}

export interface GETV1ChatMessagesResponse {
  messages: ChatTimelineMessage[]
  // Pass back as `before` to load the previous page; null when the stream start is reached.
  nextCursor?: string | null
}

// --- Mark-as-read -------------------------------------------------------------
// Fan: advances the broadcast watermark. Owner: marks one message's reply room read.
export const putV1ChatReadBodySchema = z.object({
  lastReadMessageId: messageIdCursorSchema,
})

export type PUTV1ChatReadBody = z.infer<typeof putV1ChatReadBodySchema>

// --- Fan chat list ------------------------------------------------------------

export interface ChatThreadListItem {
  artist: ChatArtistBrief
  // false = a lapsed subscription kept reachable for its paid-window broadcast archive
  // (read-only; sending disabled until re-subscribe). true = currently entitled.
  entitled: boolean
  lastMessage?: ChatMessagePreview | null
  unreadCount: number
}

export interface GETV1ChatThreadsResponse {
  threads: ChatThreadListItem[]
}

// --- Artist resource (resolve handle → id + viewer's role) -------------------

export interface GETV1ChatArtistResponse {
  artist: ChatArtistBrief
  // The viewer owns this artist (→ studio).
  isOwner: boolean
  // The viewer may currently read the live broadcast (owner or paid-up fan).
  entitled: boolean
}

// --- Artist reply room (all fans' replies to one message) ---------------------

export const getV1ChatRepliesQuerySchema = z.object({
  before: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export type GETV1ChatRepliesQuery = z.infer<typeof getV1ChatRepliesQuerySchema>

export interface ChatReplyWithFan extends ChatReplyDTO {
  fan?: ChatUserBrief | null
}

export interface GETV1ChatRepliesResponse {
  replies: ChatReplyWithFan[]
  nextCursor?: string | null
}
