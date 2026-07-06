import {
  MAX_LIBRARY_DESCRIPTION_LENGTH,
  MAX_LIBRARY_ICON_LENGTH,
  MAX_LIBRARY_NAME_LENGTH,
} from '@litomi/domain/library/policy'
import { bigint, boolean, index, integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

import { userTable } from './user'

export const libraryTable = pgTable.withRLS(
  'library',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: MAX_LIBRARY_NAME_LENGTH }).notNull(),
    description: varchar('description', { length: MAX_LIBRARY_DESCRIPTION_LENGTH }),
    color: integer('color'),
    icon: varchar('icon', { length: MAX_LIBRARY_ICON_LENGTH }),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt,
  },
  (table) => [index('idx_library_user_id').on(table.userId)],
)

export const libraryItemTable = pgTable.withRLS(
  'library_item',
  {
    libraryId: bigint('library_id', { mode: 'number' })
      .references(() => libraryTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.libraryId, table.mangaId] }),
    index('idx_library_item_created_at').on(table.createdAt.desc()),
    index('idx_library_item_manga_library').on(table.mangaId, table.libraryId),
  ],
)

export const pinnedLibraryTable = pgTable.withRLS(
  'pinned_library',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    libraryId: bigint('library_id', { mode: 'number' })
      .references(() => libraryTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.libraryId] }),
    index('idx_pinned_library_library_id').on(table.libraryId, table.createdAt),
  ],
)
