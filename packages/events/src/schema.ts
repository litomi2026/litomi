import { z } from 'zod'

// A persisted-and-fanned-out Chat message. The api mints messageId/createdAt
// and emits this; the worker validates, persists to NoSQL, relays to Valkey, and
// pushes. `streamId` is the NoSQL shard key; `creatorId` drives subscriber fan-out.
export const chatMessageEventSchema = z.object({
  messageId: z.string().min(1),
  creatorId: z.number().int().positive(),
  streamId: z.string().min(1),
  senderId: z.number().int().positive(),
  kind: z.enum(['broadcast', 'reply']),
  contentType: z.string().min(1),
  content: z.unknown(),
  createdAt: z.iso.datetime(),
})

export type ChatMessageEvent = z.infer<typeof chatMessageEventSchema>
