import { bigint, index, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createdAt, updatedAt } from '../columns'

// Chat message store — runs on a dedicated CockroachDB cluster (Postgres-wire).
// Messages reference users only by opaque id (no FK to the app DB), so this lives
// independently. messageId is a ULID: lexicographically time-sortable, so the
// primary-key index already orders a stream newest-first.
//
// Stream model (DearU-Message, per-MESSAGE reply rooms):
//   b:{artistId}             broadcast — the artist's one-way feed of "messages".
//   rb:{artistId}:{messageId} reply room — fans' replies to ONE message. Append-only:
//                             fans write, the artist reads the whole room, and fans
//                             never see each other's replies. There is NO per-fan 1:1
//                             stream — a fan never has a private back-and-forth thread.
// The artist's realtime "all replies" panel is fed by the Valkey-only inbound channel
// c:{artistId} (not a stored stream); see packages/db/src/chat/query/stream.ts.

export const chatMessageTable = pgTable(
  'chat_message',
  {
    streamId: varchar('stream_id', { length: 64 }).notNull(),
    messageId: varchar('message_id', { length: 26 }).notNull(),
    senderId: bigint('sender_id', { mode: 'number' }).notNull(),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    content: jsonb().notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.streamId, table.messageId] }),
    index('idx_chat_message_stream_sender').on(table.streamId, table.senderId, table.messageId),
    index('idx_chat_message_sender_stream').on(table.senderId, table.streamId),
  ],
).enableRLS()

export const chatReadCursorTable = pgTable(
  'chat_read_cursor',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    streamId: varchar('stream_id', { length: 64 }).notNull(),
    lastReadMessageId: varchar('last_read_message_id', { length: 26 }).notNull(),
    updatedAt,
  },
  (table) => [primaryKey({ columns: [table.userId, table.streamId] })],
).enableRLS()

export const chatThreadTable = pgTable('chat_thread', {
  streamId: varchar('stream_id', { length: 64 }).primaryKey(),
  lastMessageId: varchar('last_message_id', { length: 26 }).notNull(),
  lastSenderId: bigint('last_sender_id', { mode: 'number' }).notNull(),
  lastContentType: varchar('last_content_type', { length: 32 }).notNull(),
  lastPreview: varchar('last_preview', { length: 200 }).notNull(),
  lastCreatedAt: timestamp('last_created_at', { precision: 3, withTimezone: true }).notNull(),
  updatedAt,
}).enableRLS()

// App DB와 Chat DB 간에는 물리적 FK가 없으므로 탈퇴 정리는 App DB의 user_erasure outbox를 chat-worker가 폴링해 수행합니다(query/erasure.ts).
