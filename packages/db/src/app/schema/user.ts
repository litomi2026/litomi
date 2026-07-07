import { DEFAULT_SEARCH_LANGUAGE, MAX_SEARCH_LANGUAGE_LENGTH } from '@litomi/domain/search/language'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

export const userTable = pgTable.withRLS('user', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  name: varchar({ length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: varchar({ length: 32 }).notNull(),
  imageURL: varchar('image_url', { length: 256 }),
  loginAt: timestamp('login_at', { precision: 3, withTimezone: true }),
  logoutAt: timestamp('logout_at', { precision: 3, withTimezone: true }),
  createdAt,
})

export const userSettingsTable = pgTable.withRLS('user_settings', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  historySyncEnabled: boolean('history_sync_enabled').notNull().default(true),
  adultVerifiedAdVisible: boolean('adult_verified_ad_visible').notNull().default(false),
  defaultCensorshipEnabled: boolean('default_censorship_enabled').notNull().default(true),
  searchLanguage: varchar('search_language', { length: MAX_SEARCH_LANGUAGE_LENGTH })
    .notNull()
    .default(DEFAULT_SEARCH_LANGUAGE),
  autoDeletionDay: smallint('auto_deletion_day').notNull().default(90), // 0 = disabled
})

// 탈퇴 파기 outbox — 탈퇴 트랜잭션 안에서 이 행을 남기고, chat-worker가 폴링해 Chat DB
// (별도 클러스터, FK/cascade 불가)의 메시지·커서를 지운 뒤 행을 제거합니다. userTable로의
// FK를 걸면 유저 삭제와 함께 cascade로 사라지므로 의도적으로 참조하지 않습니다.
export const userErasureTable = pgTable.withRLS('user_erasure', {
  userId: bigint('user_id', { mode: 'number' }).primaryKey(),
  createdAt,
})

export const userFollowTable = pgTable.withRLS(
  'user_follow',
  {
    followerId: bigint('follower_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    followeeId: bigint('followee_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followeeId] }),
    index('idx_user_follow_followee_id').on(table.followeeId),
    check('user_follow_no_self_follow', sql`${table.followerId} <> ${table.followeeId}`),
  ],
)
