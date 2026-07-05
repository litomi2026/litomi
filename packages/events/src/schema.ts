import { z } from 'zod'

// A persisted-and-relayed chat message on TOPIC_CHAT_MESSAGE. The api mints
// messageId/createdAt and emits this; the chat-worker validates, persists to CockroachDB,
// relays to Valkey, and enqueues push. Discriminated by `kind`:
//   - broadcast: the artist's one-to-many feed message (fan-out-on-read).
//   - dm:        one message of a private 1:1 conversation (fan reply OR artist answer),
//                anchored to the broadcast bubble it started from (contextMessageId).
// Kafka key (producer.ts) = the conversation id, so a conversation's messages stay ordered
// on one partition: `b:{artistId}` for broadcast, `dm:{artistId}:{fanId}` for dm.

export const chatBroadcastEventSchema = z.object({
  kind: z.literal('broadcast'),
  artistId: z.number().int().positive(),
  messageId: z.string().min(1),
  contentType: z.string().min(1),
  content: z.unknown(),
  createdAt: z.iso.datetime(),
})

export type ChatBroadcastEvent = z.infer<typeof chatBroadcastEventSchema>

export const chatDirectMessageEventSchema = z.object({
  kind: z.literal('dm'),
  artistId: z.number().int().positive(),
  fanId: z.number().int().positive(),
  contextMessageId: z.string().min(1),
  messageId: z.string().min(1),
  senderRole: z.enum(['artist', 'fan']),
  // The specific message this one answers (for the "far apart → quote" UI); null = no quote.
  quotedMessageId: z.string().nullable(),
  contentType: z.string().min(1),
  content: z.unknown(),
  createdAt: z.iso.datetime(),
})

export type ChatDirectMessageEvent = z.infer<typeof chatDirectMessageEventSchema>

export const chatMessageEventSchema = z.discriminatedUnion('kind', [
  chatBroadcastEventSchema,
  chatDirectMessageEventSchema,
])

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
//   - direct: a single push to ONE recipient (a fan's reply → the artist, or the artist's
//     1:1 answer → the fan). No fan-out.
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
    kind: z.literal('direct'),
    // Partition/ordering key — the conversation's artist.
    artistId: z.number().int().positive(),
    recipientUserId: z.number().int().positive(),
    payload: chatPushPayloadSchema,
  }),
])

export type ChatPushFanoutEvent = z.infer<typeof chatPushFanoutEventSchema>
