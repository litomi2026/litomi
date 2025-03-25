import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow(),
  loginId: varchar('login_id', { length: 255 }).notNull().unique(),
  password: text().notNull(),
  name: varchar({ length: 255 }).notNull(),
})

export const bookmark = pgTable('bookmark', {
  userId: integer('user_id').references(() => user.id),
  mangaId: integer('manga_id').notNull(),
})
