import { bigint, foreignKey, integer, pgTable, primaryKey, smallint, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { userTable } from './user'

export const mangaRecommendationSetTable = pgTable('manga_recommendation_set', {
  userId: bigint('user_id', { mode: 'number' })
    .primaryKey()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  generatedAt: timestamp('generated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
}).enableRLS()

export const mangaRecommendationTable = pgTable(
  'manga_recommendation',
  {
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    mangaId: integer('manga_id').notNull(),
    rank: smallint('rank').notNull(),
    score: integer('score').notNull(),
    reasonMask: integer('reason_mask').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    uniqueIndex('idx_manga_recommendation_user_rank').on(table.userId, table.rank),
    foreignKey({
      name: 'fk_manga_recommendation_set',
      columns: [table.userId],
      foreignColumns: [mangaRecommendationSetTable.userId],
    }).onDelete('cascade'),
  ],
).enableRLS()
