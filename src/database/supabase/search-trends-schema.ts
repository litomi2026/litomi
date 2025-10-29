import { bigint, date, index, integer, pgTable, smallint, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

export const searchTrendsTable = pgTable(
  'search_trends',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    keyword: varchar({ length: 200 }).notNull(),
    searchCount: integer('search_count').notNull().default(1),
    date: date().notNull().defaultNow(),
    hour: smallint(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.keyword, table.date, table.hour),
    index('idx_search_trends_date').on(table.date),
    index('idx_search_trends_keyword').on(table.keyword),
    index('idx_search_trends_date_hour').on(table.date, table.hour),
  ],
).enableRLS()
