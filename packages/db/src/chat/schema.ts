import { bigint, index, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createdAt, updatedAt } from '../columns'

// Chat store — runs on a dedicated CockroachDB cluster (Postgres-wire). Rows reference
// users/artists only by opaque id (no FK to the app DB), so this lives independently;
// user_erasure is reconciled by the chat-worker via an app-DB outbox (query/erasure.ts).
//
// messageId is a ULID: lexicographically time-sortable, so a primary-key range scan
// already orders a conversation oldest→newest without a separate timestamp index.
//
// Two purpose-built logs (no polymorphic "stream"):
//   chat_broadcast     — the artist's one-to-many feed (fan-out-on-READ via per-fan cursor).
//   chat_dm_message    — the private 1:1 conversation between the artist and ONE fan.
//                        Holds BOTH the fan's replies and the artist's answers. Anchored to
//                        the broadcast bubble it started from (contextMessageId).
//
// The same 1:1 log is read two ways (CQRS):
//   fan timeline   — PK (artistId, fanId, messageId): the fan's continuous chat.
//   artist reply   — idx (artistId, contextMessageId, fanId, messageId): message M's reply
//     room          room, grouped by fan; also serves the per-message reply quota count.
// Privacy is structural: a fan can only read WHERE fanId = self, so one fan never sees
// another fan's 1:1 messages (or the artist's private answers to them).

// 아티스트의 1→N 공지 피드. 말풍선(message)들이 쌓이는 스트림.
export const chatBroadcastTable = pgTable(
  'chat_broadcast',
  {
    artistId: bigint('artist_id', { mode: 'number' }).notNull(),
    messageId: varchar('message_id', { length: 26 }).notNull(),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    content: jsonb().notNull(),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.artistId, table.messageId] })],
).enableRLS()

// 팬↔아티스트 사적 1:1 대화. 팬의 답장과 아티스트의 되답장을 한 로그에 담고,
// 대화가 시작된 브로드캐스트 말풍선(contextMessageId)에 앵커된다.
export const chatDmMessageTable = pgTable(
  'chat_dm_message',
  {
    artistId: bigint('artist_id', { mode: 'number' }).notNull(),
    fanId: bigint('fan_id', { mode: 'number' }).notNull(),
    // 이 1:1 교환이 앵커된 브로드캐스트 말풍선. 팬 답장과 그에 대한 아티스트 답장이 같은 값을 공유.
    contextMessageId: varchar('context_message_id', { length: 26 }).notNull(),
    messageId: varchar('message_id', { length: 26 }).notNull(),
    // 'artist' | 'fan' — 발신 주체. artist.userId 비교 대신 명시 역할로 방향을 인코딩.
    senderRole: varchar('sender_role', { length: 6 }).notNull(),
    // 이 메시지가 답한 대상 메시지(인접하지 않으면 클라가 인용 프리뷰로 렌더). null = 인용 없음.
    quotedMessageId: varchar('quoted_message_id', { length: 26 }),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    content: jsonb().notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.artistId, table.fanId, table.messageId] }),
    index('idx_chat_dm_reply_room').on(table.artistId, table.contextMessageId, table.fanId, table.messageId),
  ],
).enableRLS()

// 팬의 통합 타임라인 읽음 워터마크. 방송 + 1:1 답장이 하나의 messageId(ULID) 타임라인이라
// 읽음 위치도 (userId=fanId, artistId)당 하나면 충분하다(안읽음 = 방송>커서 + 아티스트답장>커서).
// 구조화 키라 unread 조인이 순수 eq(col,col) — scope 문자열/concat 불필요.
export const chatReadCursorTable = pgTable(
  'chat_read_cursor',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    artistId: bigint('artist_id', { mode: 'number' }).notNull(),
    lastReadMessageId: varchar('last_read_message_id', { length: 26 }).notNull(),
    updatedAt,
  },
  (table) => [primaryKey({ columns: [table.userId, table.artistId] })],
).enableRLS()

// 아티스트의 말풍선별 답장방 읽음 워터마크(userId = 오너 userId, contextMessageId당 하나).
export const chatReplyReadCursorTable = pgTable(
  'chat_reply_read_cursor',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    artistId: bigint('artist_id', { mode: 'number' }).notNull(),
    contextMessageId: varchar('context_message_id', { length: 26 }).notNull(),
    lastReadMessageId: varchar('last_read_message_id', { length: 26 }).notNull(),
    updatedAt,
  },
  (table) => [primaryKey({ columns: [table.userId, table.artistId, table.contextMessageId] })],
).enableRLS()

// 아티스트별 최신 브로드캐스트 요약 — 팬 채팅 리스트/프리뷰용. DM last/unread은 별도 요약 없이
// chat_dm_message PK 역스캔으로 파생한다.
export const chatBroadcastSummaryTable = pgTable('chat_broadcast_summary', {
  artistId: bigint('artist_id', { mode: 'number' }).primaryKey(),
  lastMessageId: varchar('last_message_id', { length: 26 }).notNull(),
  lastPreview: varchar('last_preview', { length: 200 }).notNull(),
  lastCreatedAt: timestamp('last_created_at', { precision: 3, withTimezone: true }).notNull(),
  updatedAt,
}).enableRLS()
