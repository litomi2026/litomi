import { type AnyPgColumn, bigint, index, integer, pgTable, primaryKey, smallint, varchar } from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

import { userTable } from './user'

export const postTable = pgTable.withRLS(
  'post',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }).references(() => userTable.id, { onDelete: 'set null' }),
    parentPostId: bigint('parent_post_id', { mode: 'number' }).references((): AnyPgColumn => postTable.id, {
      onDelete: 'set null',
    }),
    referredPostId: bigint('referred_post_id', { mode: 'number' }).references((): AnyPgColumn => postTable.id, {
      onDelete: 'set null',
    }),
    mangaId: integer('manga_id'),
    content: varchar({ length: 160 }),
    type: smallint().notNull(), // 'text', 'image', 'video', 'audio', 'poll', 'event', etc.
    createdAt,
  },
  (table) => [
    index('idx_post_user_id').on(table.userId),
    index('idx_post_manga_id').on(table.mangaId),
    index('idx_post_parent_post_id').on(table.parentPostId),
    index('idx_post_referred_post_id').on(table.referredPostId),
  ],
)

export const postLikeTable = pgTable.withRLS(
  'post_like',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    postId: bigint('post_id', { mode: 'number' })
      .references(() => postTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] }), index('idx_post_like_post_id').on(table.postId)],
)
