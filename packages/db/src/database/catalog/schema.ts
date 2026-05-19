import { index, integer, pgTable, primaryKey, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const mangaTable = pgTable('manga', {
  id: integer().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  title: text().notNull(),
  type: smallint().notNull(),
  description: text(),
  lines: text().array().notNull().default([]),
  count: smallint(),
  artists: text().array().notNull().default([]),
  characters: text().array().notNull().default([]),
  series: text().array().notNull().default([]),
  groups: text().array().notNull().default([]),
  languages: text().array().notNull().default([]),
  uploader: text(),
  tagValues: text('tag_values').array().notNull().default([]),
  tagCategories: smallint('tag_categories').array().notNull().default([]),
})
