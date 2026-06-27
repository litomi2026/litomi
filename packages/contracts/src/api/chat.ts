import { z } from 'zod'

export const CHAT_TEXT_MAX_LENGTH = 2000
export const CHAT_MEDIA_URL_MAX_LENGTH = 2048

export const chatContentTypeSchema = z.enum(['text', 'image', 'voice', 'video'])
export type ChatContentType = z.infer<typeof chatContentTypeSchema>

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
