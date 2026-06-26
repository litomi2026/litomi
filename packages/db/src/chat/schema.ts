import { bigint, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'

// Chat message store — runs on a dedicated CockroachDB cluster (Postgres-wire).
// Messages reference users only by opaque id (no FK to the app DB), so this lives
// independently. messageId is a ULID: lexicographically time-sortable, so the
// primary-key index already orders a stream newest-first.

export const chatMessageTable = pgTable(
  'chat_message',
  {
    // Stream key: 'b:{creatorId}' (broadcast) | 'r:{creatorId}:{fanId}' (reply).
    streamId: varchar('stream_id', { length: 64 }).notNull(),
    messageId: varchar('message_id', { length: 26 }).notNull(),
    senderId: bigint('sender_id', { mode: 'number' }).notNull(),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.streamId, table.messageId] })],
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

// TODO: App DB와 Chat DB 간에 물리적 FK가 없기 때문에, App DB에서 유저가 탈퇴할 때 Chat DB의 데이터는 고아(Orphan) 데이터로 남습니다.
