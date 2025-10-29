import { bigint, boolean, index, integer, pgTable, smallint, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

import { userTable } from './schema'

export const notificationCriteriaTable = pgTable(
  'notification_criteria',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: varchar({ length: 32 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastMatchedAt: timestamp('last_matched_at', { withTimezone: true }),
    matchCount: integer('match_count').notNull().default(0),
  },
  (table) => [index('idx_notification_criteria_user_active').on(table.userId, table.isActive)],
).enableRLS()

export const notificationConditionTable = pgTable(
  'notification_condition',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    criteriaId: bigint('criteria_id', { mode: 'number' })
      .references(() => notificationCriteriaTable.id, { onDelete: 'cascade' })
      .notNull(),
    type: smallint().notNull(), // 1=series, 2=character, 3=tag, 4=artist, 5=group, 6=language, etc.
    value: varchar({ length: 100 }).notNull(), // big_breasts, sole_female, etc.
  },
  (table) => [
    index('idx_notification_condition_criteria').on(table.criteriaId),
    index('idx_notification_condition_type_value').on(table.type, table.value),
    unique('idx_notification_condition_unique').on(table.criteriaId, table.type, table.value),
  ],
).enableRLS()

export const mangaSeenTable = pgTable('manga_seen', {
  mangaId: integer('manga_id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()
