import { integer, pgTable, smallint, text, timestamp } from 'drizzle-orm/pg-core'

export const mangaTable = pgTable('manga', {
  id: integer().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
  title: text().notNull(),
  description: text(),
  lines: text().array(),
  type: smallint().notNull(),
  count: smallint(),
}).enableRLS()

export const artistTable = pgTable('artist', {
  id: integer().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaArtistTable = pgTable('manga_artist', {
  mangaId: integer().references(() => mangaTable.id),
  artistId: integer().references(() => artistTable.id),
}).enableRLS()

export const characterTable = pgTable('character', {
  id: integer().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaCharacterTable = pgTable('manga_character', {
  mangaId: integer().references(() => mangaTable.id),
  characterId: integer().references(() => characterTable.id),
}).enableRLS()

export const tagTable = pgTable('tag', {
  id: integer().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaTagTable = pgTable('manga_tag', {
  mangaId: integer().references(() => mangaTable.id),
  tagId: integer().references(() => tagTable.id),
}).enableRLS()

export const seriesTable = pgTable('series', {
  id: integer().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaSeriesTable = pgTable('manga_series', {
  mangaId: integer().references(() => mangaTable.id),
  seriesId: integer().references(() => seriesTable.id),
}).enableRLS()

export const groupTable = pgTable('group', {
  id: integer().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaGroupTable = pgTable('manga_group', {
  mangaId: integer().references(() => mangaTable.id),
  groupId: integer().references(() => groupTable.id),
}).enableRLS()

export const languageTable = pgTable('language', {
  id: smallint().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaLanguageTable = pgTable('manga_language', {
  mangaId: integer().references(() => mangaTable.id),
  languageId: smallint().references(() => languageTable.id),
}).enableRLS()

export const uploaderTable = pgTable('uploader', {
  id: smallint().primaryKey(),
  value: text().notNull().unique(),
}).enableRLS()

export const mangaUploaderTable = pgTable('manga_uploader', {
  mangaId: integer().references(() => mangaTable.id),
  uploaderId: smallint().references(() => uploaderTable.id),
}).enableRLS()
