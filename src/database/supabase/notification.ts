import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

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

export const notificationCriteriaTable = pgTable(
  'notification_criteria',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: varchar({ length: 32 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastMatchedAt: timestamp('last_matched_at', { withTimezone: true }),
    matchCount: integer('match_count').notNull().default(0),
  },
  (table) => [index('idx_notification_criteria_user_active').on(table.userId, table.isActive)],
).enableRLS()

export const notificationConditionTable = pgTable(
  'notification_condition',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    criteriaId: bigint('criteria_id', { mode: 'number' })
      .references(() => notificationCriteriaTable.id, { onDelete: 'cascade' })
      .notNull(),
    type: smallint().notNull(), // 1=series, 2=character, 3=tag, 4=artist, 5=group, 6=language, etc.
    value: varchar({ length: 100 }).notNull(), // big_breasts, sole_female, etc.
    isExcluded: boolean('is_excluded').notNull().default(false), // true = exclude this condition from matches
  },
  (table) => [
    index('idx_notification_condition_criteria').on(table.criteriaId),
    index('idx_notification_condition_type_value').on(table.type, table.value, table.isExcluded),
    unique('idx_notification_condition_unique').on(table.criteriaId, table.type, table.value),
  ],
).enableRLS()

export const mangaSeenTable = pgTable('manga_seen', {
  mangaId: integer('manga_id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()
