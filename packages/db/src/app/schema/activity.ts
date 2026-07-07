import { bigint, index, integer, pgTable, primaryKey, smallint } from 'drizzle-orm/pg-core'
import { createdAt, timestamps, updatedAt } from '../../columns'

import { userTable } from './user'

export const bookmarkTable = pgTable.withRLS(
  'bookmark',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    index('idx_bookmark_created_at').on(table.createdAt.desc()),
  ],
)

export const readingHistoryTable = pgTable.withRLS(
  'reading_history',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    lastPage: smallint('last_page').notNull(),
    updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    index('idx_reading_history_updated_at').on(table.userId, table.updatedAt.desc()),
    index('idx_reading_history_updated_at_only').on(table.updatedAt.desc()),
    index('idx_reading_history_manga_user').on(table.mangaId, table.userId),
  ],
)

export const userRatingTable = pgTable.withRLS(
  'user_rating',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    rating: smallint('rating').notNull(), // 1-5 stars
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    index('idx_user_rating_manga_rating_user').on(table.mangaId, table.rating, table.userId),
  ],
)
