import { bigint, integer, pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const userTable = pgTable('user', {
  id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  loginAt: timestamp('login_at', { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp('logout_at', { withTimezone: true }).defaultNow().notNull(),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: varchar({ length: 32 }).notNull(),
  imageURL: varchar('image_url', { length: 256 }),
})

export const bookmarkTable = pgTable(
  'bookmark',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id)
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    source: integer().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mangaId] })],
)

export const userCensorshipTable = pgTable('user_censorship', {
  id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id)
    .notNull(),
  key: integer().notNull(),
  value: varchar({ length: 256 }).notNull(),
  level: integer().notNull(),
})
