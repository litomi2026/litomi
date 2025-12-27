import { bigint, boolean, index, integer, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'

import { userTable } from './user'

export const libraryTable = pgTable(
  'library',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    name: varchar('name', { length: MAX_LIBRARY_NAME_LENGTH }).notNull(),
    description: varchar('description', { length: MAX_LIBRARY_DESCRIPTION_LENGTH }),
    color: integer('color'),
    icon: varchar('icon', { length: 4 }), // Emoji
    isPublic: boolean('is_public').default(false).notNull(),
  },
  (table) => [index('idx_library_user_id').on(table.userId)],
).enableRLS()

export const libraryItemTable = pgTable(
  'library_item',
  {
    libraryId: bigint('library_id', { mode: 'number' })
      .references(() => libraryTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.libraryId, table.mangaId] }),
    index('idx_library_item_created_at').on(table.createdAt.desc()),
  ],
).enableRLS()
