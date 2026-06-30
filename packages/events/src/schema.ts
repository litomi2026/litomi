import { z } from 'zod'

// A persisted-and-fanned-out Chat message. The api mints messageId/createdAt
// and emits this; the worker validates, persists to NoSQL, relays to Valkey, and
// pushes. `streamId` is the NoSQL shard key; `artistId` drives subscriber fan-out.
export const chatMessageEventSchema = z.object({
  messageId: z.string().min(1),
  artistId: z.number().int().positive(),
  streamId: z.string().min(1),
  senderId: z.number().int().positive(),
  contentType: z.string().min(1),
  content: z.unknown(),
  createdAt: z.iso.datetime(),
})

export type ChatMessageEvent = z.infer<typeof chatMessageEventSchema>

// A fully-rendered web-push payload. The chat-worker renders it ONCE (resolving the
// artist/sender brief on the cheap control path) and carries it through every fan-out
// page, so the push worker never re-reads the message body or the artist brief.
export const chatPushPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  // App-relative deep link (e.g. /sobok/{handle}), not an absolute URL.
  url: z.string().min(1),
  // Collapses repeat notifications on the device (also absorbs at-least-once duplicates).
  tag: z.string().min(1),
  icon: z.string().optional(),
})

export type ChatPushPayload = z.infer<typeof chatPushPayloadSchema>

// A push fan-out job. Discriminated by `kind`:
//   - broadcast: ONE keyset page of an artist's subscribers. The push worker delivers the
//     page and re-enqueues the next (afterUserId = last id) until a short page ends the
//     chain — so each job is bounded work and a mega-broadcast never holds a partition.
//   - reply: a single push to the artist for a fan's reply (no fan-out).
export const chatPushFanoutEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('broadcast'),
    artistId: z.number().int().positive(),
    messageId: z.string().min(1),
    // The sender (artist) — never push a broadcast back to its author.
    excludeUserId: z.number().int().positive(),
    // Keyset cursor; 0 = first page.
    afterUserId: z.number().int().nonnegative(),
    payload: chatPushPayloadSchema,
  }),
  z.object({
    kind: z.literal('reply'),
    artistId: z.number().int().positive(),
    messageId: z.string().min(1),
    recipientUserId: z.number().int().positive(),
    payload: chatPushPayloadSchema,
  }),
])

export type ChatPushFanoutEvent = z.infer<typeof chatPushFanoutEventSchema>
