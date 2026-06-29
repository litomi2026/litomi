import { bigint, index, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'

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
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.streamId, table.messageId] }),
    // Seek one sender's messages within a set of streams — a fan pulling their OWN
    // replies for the messages currently on screen (`streamId IN (...) AND senderId = me`),
    // tight even on a message with tens of thousands of replies from other fans.
    index('idx_chat_message_stream_sender').on(table.streamId, table.senderId, table.messageId),
  ],
).enableRLS()

export const chatReadCursorTable = pgTable(
  'chat_read_cursor',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    streamId: varchar('stream_id', { length: 64 }).notNull(),
    lastReadMessageId: varchar('last_read_message_id', { length: 26 }).notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.streamId] })],
).enableRLS()

// Per-stream conversation summary, upserted by the worker on every BROADCAST message
// (one row per `b:{artistId}` stream). O(1) per message, so the fan chat list renders
// its "last message" preview without scanning chat_message. Reply rooms are deliberately
// NOT summarized here: the artist's per-message unread is counted live from chat_message
// (bounded), and fans never enumerate reply rooms.
export const chatThreadTable = pgTable('chat_thread', {
  // 'b:{artistId}'
  streamId: varchar('stream_id', { length: 64 }).primaryKey(),
  lastMessageId: varchar('last_message_id', { length: 26 }).notNull(),
  lastSenderId: bigint('last_sender_id', { mode: 'number' }).notNull(),
  lastContentType: varchar('last_content_type', { length: 32 }).notNull(),
  lastPreview: varchar('last_preview', { length: 200 }).notNull(),
  lastCreatedAt: timestamp('last_created_at', { precision: 3, withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
}).enableRLS()

// TODO: App DB와 Chat DB 간에 물리적 FK가 없기 때문에, App DB에서 유저가 탈퇴할 때 Chat DB의 데이터는 고아(Orphan) 데이터로 남습니다.
