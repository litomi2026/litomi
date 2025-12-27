import { bigint, index, integer, pgTable, smallint, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const credentialTable = pgTable(
  'credential',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    credentialId: varchar({ length: 256 }).notNull(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }),
    counter: integer().notNull().default(0),
    publicKey: text('public_key').notNull(),
    deviceType: smallint('device_type').notNull(),
    transports: text().array(),
  },
  (table) => [
    index('idx_credential_user_id').on(table.userId),
    unique('idx_credential_credential_id').on(table.credentialId),
  ],
).enableRLS()


