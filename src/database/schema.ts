import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const userTable = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow(),
  loginAt: timestamp('login_at').defaultNow(),
  logoutAt: timestamp('logout_at').defaultNow(),
  loginId: varchar('login_id', { length: 32 }).notNull().unique(),
  passwordHash: text().notNull(),
  nickname: varchar({ length: 32 }).notNull(),
})

export const bookmarkTable = pgTable('bookmark', {
  userId: integer('user_id').references(() => userTable.id),
  mangaId: integer('manga_id').notNull(),
})
