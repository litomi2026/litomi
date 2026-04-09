import { bigint, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const authSessionTable = pgTable(
  'auth_session',
  {
    id: uuid('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    familyId: uuid('family_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }),
    absoluteExpiresAt: timestamp('absolute_expires_at', { precision: 3, withTimezone: true }).notNull(),
    idleExpiresAt: timestamp('idle_expires_at', { precision: 3, withTimezone: true }).notNull(),
    rotatedAt: timestamp('rotated_at', { precision: 3, withTimezone: true }),
    revokedAt: timestamp('revoked_at', { precision: 3, withTimezone: true }),
    replacedBySessionId: uuid('replaced_by_session_id'),
    userAgent: varchar('user_agent', { length: 512 }),
    ipAddress: varchar('ip_address', { length: 64 }),
  },
  (table) => [
    index('idx_auth_session_user_id').on(table.userId),
    index('idx_auth_session_family_id').on(table.familyId),
    index('idx_auth_session_replaced_by_session_id').on(table.replacedBySessionId),
    uniqueIndex('idx_auth_session_token_hash').on(table.tokenHash),
  ],
).enableRLS()
