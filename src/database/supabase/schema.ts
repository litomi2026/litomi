import {
  AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'
import 'server-only'

import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'

export const userTable = pgTable('user', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  loginAt: timestamp('login_at', { precision: 3, withTimezone: true }),
  logoutAt: timestamp('logout_at', { precision: 3, withTimezone: true }),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  name: varchar({ length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: varchar({ length: 32 }).notNull(),
  imageURL: varchar('image_url', { length: 256 }),
  autoDeletionDays: smallint('auto_deletion_days').notNull().default(180), // 0 = disabled
}).enableRLS()

export const bbatonGenderEnum = pgEnum('bbaton_gender', ['F', 'M'])

export const bbatonVerificationTable = pgTable(
  'bbaton_verification',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .primaryKey(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    bbatonUserId: varchar('bbaton_user_id', { length: 128 }).notNull(),
    adultFlag: boolean('adult_flag').notNull(),
    birthYear: smallint('birth_year').notNull(), // NOTE: 실제 생년이 아니라 나이대(예: 20대 -> 20)로 올 수 있어요
    gender: bbatonGenderEnum('gender').notNull(),
    income: varchar('income', { length: 32 }).notNull(),
    student: boolean('student').notNull(),
  },
  (table) => [
    unique('bbaton_verification_bbaton_user_id_unique').on(table.bbatonUserId),
    index('idx_bbaton_verification_verified_at').on(table.verifiedAt.desc()),
  ],
).enableRLS()

export const bookmarkTable = pgTable(
  'bookmark',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mangaId] }), index('idx_bookmark_user_id').on(table.userId)],
).enableRLS()

export const libraryTable = pgTable(
  'library',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    name: varchar('name', { length: MAX_LIBRARY_NAME_LENGTH }).notNull(),
    description: varchar('description', { length: MAX_LIBRARY_DESCRIPTION_LENGTH }),
    color: integer('color'),
    icon: varchar('icon', { length: 4 }), // Emoji
    isPublic: boolean('is_public').default(false).notNull(),
  },
  (table) => [index('idx_library_user_id').on(table.userId)],
).enableRLS()

export const libraryItemTable = pgTable(
  'library_item',
  {
    libraryId: bigint('library_id', { mode: 'number' })
      .references(() => libraryTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.libraryId, table.mangaId] }),
    index('idx_library_item_created_at').on(table.createdAt.desc()),
  ],
).enableRLS()

export const userCensorshipTable = pgTable(
  'user_censorship',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    key: smallint().notNull(),
    value: varchar({ length: 256 }).notNull(),
    level: smallint().notNull(),
  },
  (table) => [index('idx_user_censorship_user_id').on(table.userId)],
).enableRLS()

export const credentialTable = pgTable(
  'credential',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    credentialId: varchar({ length: 256 }).notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }),
    counter: integer().notNull().default(0),
    publicKey: text('public_key').notNull(),
    deviceType: smallint('device_type').notNull(),
    transports: text().array(),
  },
  (table) => [
    index('idx_credential_user_id').on(table.userId),
    unique('idx_credential_credential_id').on(table.credentialId),
  ],
).enableRLS()

export const webPushTable = pgTable('web_push', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  endpoint: text().notNull().unique(),
  p256dh: text().notNull(),
  auth: text().notNull(),
  userAgent: text('user_agent'),
}).enableRLS()

export const pushSettingsTable = pgTable('push_settings', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  quietEnabled: boolean('quiet_enabled').notNull().default(true),
  quietStart: smallint('quiet_start').notNull().default(22), // 0-23
  quietEnd: smallint('quiet_end').notNull().default(7), // 0-23
  batchEnabled: boolean('batch_enabled').notNull().default(true),
  maxDaily: smallint('max_daily').notNull().default(10),
}).enableRLS()

export const notificationTable = pgTable(
  'notification',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    type: smallint().notNull(), // 'new_manga', 'bookmark_update', etc.
    read: boolean().notNull().default(false),
    title: text().notNull(),
    body: text().notNull(),
    data: text(),
    sentAt: timestamp('sent_at', { precision: 3, withTimezone: true }),
  },
  (table) => [
    // NOTE: PARTITION BY user_id ORDER BY created_at DESC, id DESC
    index('idx_notification_user_created_id').on(table.userId, table.createdAt.desc(), table.id.desc()),
    // NOTE: createdAt < (NOW() - INTERVAL '30 days')
    index('idx_notification_created_at').on(table.createdAt),
  ],
).enableRLS()

export const postTable = pgTable(
  'post',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    parentPostId: bigint('parent_post_id', { mode: 'number' }).references((): AnyPgColumn => postTable.id),
    referredPostId: bigint('referred_post_id', { mode: 'number' }).references((): AnyPgColumn => postTable.id),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { precision: 3, withTimezone: true }),
    mangaId: integer('manga_id'),
    content: varchar({ length: 160 }),
    type: smallint().notNull(), // 'text', 'image', 'video', 'audio', 'poll', 'event', etc.
  },
  (table) => [
    index('idx_post_user_id').on(table.userId),
    index('idx_post_manga_id').on(table.mangaId),
    index('idx_post_parent_post_id').on(table.parentPostId),
    index('idx_post_referred_post_id').on(table.referredPostId),
  ],
).enableRLS()

export const postLikeTable = pgTable(
  'post_like',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    postId: bigint('post_id', { mode: 'number' })
      .references(() => postTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] }), index('idx_post_like_post_id').on(table.postId)],
).enableRLS()

export const readingHistoryTable = pgTable(
  'reading_history',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    lastPage: smallint('last_page').notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    index('idx_reading_history_updated_at').on(table.userId, table.updatedAt.desc()),
  ],
).enableRLS()

export const userRatingTable = pgTable(
  'user_rating',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    rating: smallint('rating').notNull(), // 1-5 stars
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mangaId] })],
).enableRLS()
