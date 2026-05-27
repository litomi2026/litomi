import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { userTable } from './user'

export const mangaRecommendationSetTable = pgTable(
  'manga_recommendation_set',
  {
    userId: bigint('user_id', { mode: 'number' })
      .primaryKey()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    generatedAt: timestamp('generated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_manga_recommendation_set_generated_at').on(table.generatedAt)],
).enableRLS()

export const mangaRecommendationTable = pgTable(
  'manga_recommendation',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => mangaRecommendationSetTable.userId, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    rank: smallint('rank').notNull(),
    score: integer('score').notNull(),
    reasons: text('reasons').array().notNull().default([]),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    uniqueIndex('idx_manga_recommendation_user_rank').on(table.userId, table.rank),
  ],
).enableRLS()
