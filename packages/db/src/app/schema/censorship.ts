import { bigint, index, pgTable, smallint, varchar } from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

import { userTable } from './user'

export const userCensorshipTable = pgTable.withRLS(
  'user_censorship',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    key: smallint().notNull(),
    value: varchar({ length: 256 }).notNull(),
    level: smallint().notNull(),
    createdAt,
  },
  (table) => [index('idx_user_censorship_user_id').on(table.userId)],
)
