import { bigint, boolean, pgTable, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

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

export const userSettingsTable = pgTable('user_settings', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  historySyncEnabled: boolean('history_sync_enabled').notNull().default(true),
  adultVerifiedAdVisible: boolean('adult_verified_ad_visible').notNull().default(false),
  autoDeletionDay: smallint('auto_deletion_day').notNull().default(180), // 0 = disabled
}).enableRLS()
