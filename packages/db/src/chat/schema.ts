import { bigint, index, jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'

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

// 스트림(채팅방)별 대화 요약본으로, 메시지가 저장될 때마다 워커(worker)에 의해 갱신됩니다.
// (여기서 쓰기 시점의 팬아웃(fan-out-on-WRITE)은 O(1)입니다: 수신자마다 행을 만들지 않고 스트림당 1줄만 업데이트합니다).
// 이 테이블은 chat_message 원본을 스캔할 필요 없이 두 가지 목록 화면을 매우 가볍게 구동합니다:
//   - 팬의 채팅 목록 화면 → 구독 중인 각 크리에이터의 브로드캐스트 요약 + 본인의 1:1 대화(reply) 요약 읽기
//   - 크리에이터의 인박스 화면 → 이 크리에이터의 1:1 대화(reply) 스레드들을 최신순으로 범위 스캔(range-scan)
export const chatThreadTable = pgTable(
  'chat_thread',
  {
    // 'b:{creatorId}' (broadcast) | 'r:{creatorId}:{fanId}' (reply).
    streamId: varchar('stream_id', { length: 64 }).primaryKey(),
    // Denormalized from streamId so the inbox can filter/group without parsing.
    creatorId: bigint('creator_id', { mode: 'number' }).notNull(),
    // The fan side of a reply stream; null for broadcast streams.
    fanId: bigint('fan_id', { mode: 'number' }),
    lastMessageId: varchar('last_message_id', { length: 26 }).notNull(),
    lastSenderId: bigint('last_sender_id', { mode: 'number' }).notNull(),
    lastContentType: varchar('last_content_type', { length: 32 }).notNull(),
    lastPreview: varchar('last_preview', { length: 200 }).notNull(),
    lastCreatedAt: timestamp('last_created_at', { precision: 3, withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Inbox: range-scan one creator's reply threads ordered by recency (lastMessageId is a ULID).
    index('idx_chat_thread_creator_recent').on(table.creatorId, table.lastMessageId),
    // Fan chat list: the reply threads of a fan
    index('idx_chat_thread_fan_recent').on(table.fanId, table.lastMessageId),
  ],
).enableRLS()

// TODO: App DB와 Chat DB 간에 물리적 FK가 없기 때문에, App DB에서 유저가 탈퇴할 때 Chat DB의 데이터는 고아(Orphan) 데이터로 남습니다.
