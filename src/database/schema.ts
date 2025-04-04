import { bigint, integer, pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const userTable = pgTable('user', {
  id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  loginAt: timestamp('login_at').defaultNow().notNull(),
  logoutAt: timestamp('logout_at').defaultNow().notNull(),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: varchar({ length: 32 }).notNull(),
  imageURL: varchar('image_url', { length: 256 }),
})

export const bookmarkTable = pgTable(
  'bookmark',
  {
    userId: integer('user_id').references(() => userTable.id),
    mangaId: integer('manga_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mangaId] })],
)
