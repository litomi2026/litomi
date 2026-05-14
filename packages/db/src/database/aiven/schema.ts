import { index, integer, pgTable, primaryKey, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const mangaTable = pgTable('manga', {
  id: integer().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  title: text().notNull(),
  type: smallint().notNull(),
  description: text(),
  lines: text().array(),
  count: smallint(),
}).enableRLS()

export const artistTable = pgTable('artist', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaArtistTable = pgTable(
  'manga_artist',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    artistId: integer()
      .notNull()
      .references(() => artistTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.artistId] }),
    index('idx_manga_artist_artist_id').on(table.artistId),
  ],
).enableRLS()

export const characterTable = pgTable('character', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaCharacterTable = pgTable(
  'manga_character',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    characterId: integer()
      .notNull()
      .references(() => characterTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.characterId] }),
    index('idx_manga_character_character_id').on(table.characterId),
  ],
).enableRLS()

export const tagTable = pgTable(
  'tag',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    value: text().notNull(),
    category: smallint().notNull(), // 0: female, 1: male, 2: mixed, 3: other
  },
  (table) => [unique('tag_value_category_unique').on(table.value, table.category)],
).enableRLS()

export const mangaTagTable = pgTable(
  'manga_tag',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    tagId: integer()
      .notNull()
      .references(() => tagTable.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.mangaId, table.tagId] }), index('idx_manga_tag_tag_id').on(table.tagId)],
).enableRLS()

export const seriesTable = pgTable('series', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaSeriesTable = pgTable(
  'manga_series',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    seriesId: integer()
      .notNull()
      .references(() => seriesTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.seriesId] }),
    index('idx_manga_series_series_id').on(table.seriesId),
  ],
).enableRLS()

export const groupTable = pgTable('group', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaGroupTable = pgTable(
  'manga_group',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    groupId: integer()
      .notNull()
      .references(() => groupTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.groupId] }),
    index('idx_manga_group_group_id').on(table.groupId),
  ],
).enableRLS()

export const languageTable = pgTable('language', {
  id: smallint().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaLanguageTable = pgTable(
  'manga_language',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    languageId: smallint()
      .notNull()
      .references(() => languageTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.languageId] }),
    index('idx_manga_language_language_id').on(table.languageId),
  ],
).enableRLS()

export const uploaderTable = pgTable('uploader', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaUploaderTable = pgTable(
  'manga_uploader',
  {
    mangaId: integer()
      .notNull()
      .references(() => mangaTable.id, { onDelete: 'cascade' }),
    uploaderId: integer()
      .notNull()
      .references(() => uploaderTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.mangaId, table.uploaderId] }),
    index('idx_manga_uploader_uploader_id').on(table.uploaderId),
  ],
).enableRLS()
