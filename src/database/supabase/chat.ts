import { AnyPgColumn, bigint, index, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const chatVisibilityEnum = pgEnum('chat_visibility', ['PRIVATE', 'PUBLIC', 'UNLISTED'])

export const characterTable = pgTable(
  'character',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    visibility: chatVisibilityEnum('visibility').default('PRIVATE').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_character_user_id').on(table.userId), index('idx_character_visibility').on(table.visibility)],
).enableRLS()

export const promptTable = pgTable(
  'prompt',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    characterId: varchar('character_id', { length: 128 }).notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 128 }).notNull(),
    content: text('content').notNull(),
    tags: text('tags').array(),
    visibility: chatVisibilityEnum('visibility').default('PRIVATE').notNull(),
    sourcePromptId: bigint('source_prompt_id', { mode: 'number' }).references((): AnyPgColumn => promptTable.id),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_prompt_character_id').on(table.characterId),
    index('idx_prompt_user_id').on(table.userId),
    index('idx_prompt_visibility').on(table.visibility),
    index('idx_prompt_tags').using('gin', table.tags),
  ],
).enableRLS()

export const threadTable = pgTable(
  'thread',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    characterId: varchar('character_id', { length: 128 }).notNull(),
    promptId: bigint('prompt_id', { mode: 'number' })
      .references(() => promptTable.id, { onDelete: 'cascade' })
      .notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 128 }),
    visibility: chatVisibilityEnum('visibility').default('PRIVATE').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_thread_character_id').on(table.characterId),
    index('idx_thread_prompt_id').on(table.promptId),
    index('idx_thread_user_id').on(table.userId),
    index('idx_thread_user_id_updated_at').on(table.userId, table.updatedAt.desc()),
    index('idx_thread_visibility').on(table.visibility),
  ],
).enableRLS()

export const messageTable = pgTable(
  'message',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    threadId: bigint('thread_id', { mode: 'number' })
      .references(() => threadTable.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_message_thread_id').on(table.threadId),
    index('idx_message_thread_id_created_at').on(table.threadId, table.createdAt.desc()),
  ],
).enableRLS()
