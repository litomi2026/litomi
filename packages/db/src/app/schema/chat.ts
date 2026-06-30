import { sql } from 'drizzle-orm'
import { bigint, boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { userTable } from './user'

// Relational core of the DearU-Message-style messaging feature. High-volume
// message bodies live in NoSQL (see ../nosql/chat.ts). Postgres holds
// only the low-volume relational metadata: who can broadcast, and who receives.

export const chatSubscriptionStatusEnum = pgEnum('chat_subscription_status', ['active', 'expired', 'cancelled'])

export const chatArtistTable = pgTable(
  'chat_artist',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    handle: varchar({ length: 32 }).notNull().unique(),
    displayName: varchar('display_name', { length: 64 }).notNull(),
    description: text(),
    imageURL: varchar('image_url', { length: 256 }),
    emoji: varchar({ length: 16 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_chat_artist_active').on(table.isActive)],
).enableRLS()

export const chatSubscriptionTable = pgTable(
  'chat_subscription',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    artistId: bigint('artist_id', { mode: 'number' })
      .references(() => chatArtistTable.id, { onDelete: 'cascade' })
      .notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    status: chatSubscriptionStatusEnum().notNull().default('active'),
    startedAt: timestamp('started_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // 사용자가 같은 아티스트에게 여러 개의 활성 구독을 갖는 것을 방지합니다.
    uniqueIndex('uq_active_chat_subscription').on(table.artistId, table.userId).where(sql`${table.status} = 'active'`),
    // Fan-out: enumerate the active subscribers of a artist.
    index('idx_chat_subscription_artist_status').on(table.artistId, table.status),
    // "My subscriptions" listing.
    index('idx_chat_subscription_user').on(table.userId),
    // Expiry sweeps (active -> expired).
    index('idx_chat_subscription_expires_at').on(table.expiresAt),
  ],
).enableRLS()
