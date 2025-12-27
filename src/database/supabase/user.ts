import { bigint, pgTable, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core'
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
