import { bigint, index, pgTable, smallint, timestamp, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const userCensorshipTable = pgTable(
  'user_censorship',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    key: smallint().notNull(),
    value: varchar({ length: 256 }).notNull(),
    level: smallint().notNull(),
  },
  (table) => [index('idx_user_censorship_user_id').on(table.userId)],
).enableRLS()


