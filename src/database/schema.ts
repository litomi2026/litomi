import { bigint, index, integer, pgTable, primaryKey, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const userTable = pgTable('user', {
  id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  loginAt: timestamp('login_at', { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp('logout_at', { withTimezone: true }).defaultNow().notNull(),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  name: varchar({ length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: varchar({ length: 32 }).notNull(),
  imageURL: varchar('image_url', { length: 256 }),
}).enableRLS()

export const bookmarkTable = pgTable(
  'bookmark',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id)
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    source: smallint().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mangaId] }), index('idx_bookmark_user_id').on(table.userId)],
).enableRLS()

export const userCensorshipTable = pgTable(
  'user_censorship',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    key: smallint().notNull(),
    value: varchar({ length: 256 }).notNull(),
    level: smallint().notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id)
      .notNull(),
  },
  (table) => [index('idx_user_censorship_user_id').on(table.userId)],
).enableRLS()

export const credentialTable = pgTable(
  'credential',
  {
    id: varchar({ length: 256 }).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    counter: integer().notNull().default(0),
    publicKey: text('public_key').notNull(),
    deviceType: smallint('device_type').notNull(),
    transports: text().array(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id)
      .notNull(),
  },
  (table) => [index('idx_credential_user_id').on(table.userId)],
).enableRLS()

export const challengeTable = pgTable(
  'challenge',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id)
      .notNull(),
    type: smallint().notNull(),
    challenge: varchar({ length: 256 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.type] }),
    index('idx_challenge_expires_at').on(table.expiresAt),
  ],
).enableRLS()
