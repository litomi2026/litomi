import { bigint, index, integer, pgTable, primaryKey, smallint, timestamp } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

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
