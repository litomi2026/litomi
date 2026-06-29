import { z } from 'zod'

export const CHAT_TEXT_MAX_LENGTH = 2000
export const CHAT_MEDIA_URL_MAX_LENGTH = 2048

export const chatContentTypeSchema = z.enum(['text', 'image', 'voice', 'video'])
export type ChatContentType = z.infer<typeof chatContentTypeSchema>

export const chatHandleParamSchema = z.object({
  handle: z.string().min(1),
})

export type ChatHandleParam = z.infer<typeof chatHandleParamSchema>

export const chatFanIdParamSchema = z.object({
  handle: z.string().min(1),
  fanId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})

export type ChatFanIdParam = z.infer<typeof chatFanIdParamSchema>

const mediaUrlSchema = z.url().max(CHAT_MEDIA_URL_MAX_LENGTH)

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

// A creator's 1:1 reply uses the same content shapes as any other message.
export type POSTV1ChatReplyBody = POSTV1ChatMessageBody
export const postV1ChatReplyBodySchema = postV1ChatMessageBodySchema
export type POSTV1ChatReplyResponse = POSTV1ChatMessageResponse

// --- Shared read-path DTOs ----------------------------------------------------

const MESSAGE_ID_MAX_LENGTH = 26 // ULID

export type ChatMessageContent =
  | { text: string }
  | { url: string; width?: number; height?: number }
  | { url: string; durationMs?: number }
  | { url: string; durationMs?: number; width?: number; height?: number }

export interface ChatMessageDTO {
  messageId: string
  streamId: string
  senderId: number
  kind: 'broadcast' | 'reply'
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

export interface ChatCreatorBrief {
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

// --- History (merged timeline & 1:1 thread) -----------------------------------

const messageIdCursorSchema = z.string().min(1).max(MESSAGE_ID_MAX_LENGTH)

export const getV1ChatMessagesQuerySchema = z.object({
  // Page backwards in time (older than this id) — the default scroll-up behavior.
  before: messageIdCursorSchema.optional(),
  // Page/sync forwards in time (newer than this id), e.g. after a reconnect.
  after: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export type GETV1ChatMessagesQuery = z.infer<typeof getV1ChatMessagesQuerySchema>

export interface GETV1ChatMessagesResponse {
  messages: ChatMessageDTO[]
  // Pass back as `before` to load the previous page; null when the stream start is reached.
  nextCursor?: string | null
}

// --- Mark-as-read -------------------------------------------------------------

export const putV1ChatReadBodySchema = z.object({
  lastReadMessageId: messageIdCursorSchema,
})

export type PUTV1ChatReadBody = z.infer<typeof putV1ChatReadBodySchema>

// --- Fan chat list ------------------------------------------------------------

export interface ChatThreadListItem {
  creator: ChatCreatorBrief
  // false = a lapsed subscription kept for its 1:1 history (read-only; broadcast hidden,
  // sending disabled until re-subscribe). true = currently entitled (full access).
  entitled: boolean
  lastMessage?: ChatMessagePreview | null
  unreadCount: number
}

export interface GETV1ChatThreadsResponse {
  threads: ChatThreadListItem[]
}

// --- Creator inbox ------------------------------------------------------------

export const getV1ChatInboxQuerySchema = z.object({
  before: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export type GETV1ChatInboxQuery = z.infer<typeof getV1ChatInboxQuerySchema>

export interface ChatInboxItem {
  fanId: number
  fan?: ChatUserBrief | null
  lastMessage?: ChatMessagePreview | null
  unreadCount: number
}

export interface GETV1ChatInboxResponse {
  threads: ChatInboxItem[]
  nextCursor?: string | null
}
