import { bigint, index, integer, pgTable, smallint, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

import { userTable } from './user'

export const credentialTable = pgTable.withRLS(
  'credential',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    credentialId: varchar({ length: 256 }).notNull(),
    name: varchar({ length: 32 }),
    counter: integer().notNull().default(0),
    publicKey: text('public_key').notNull(),
    deviceType: smallint('device_type').notNull(),
    transports: text().array(),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }),
    createdAt,
  },
  (table) => [
    index('idx_credential_user_id').on(table.userId),
    unique('idx_credential_credential_id').on(table.credentialId),
  ],
)
