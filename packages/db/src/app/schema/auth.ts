import { bigint, foreignKey, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { userTable } from './user'

export const authSessionFamilyTable = pgTable(
  'auth_session_family',
  {
    id: uuid('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    deviceLabel: varchar('device_label', { length: 128 }),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', { precision: 3, withTimezone: true }).notNull(),
    idleExpiresAt: timestamp('idle_expires_at', { precision: 3, withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_auth_session_family_user_id').on(table.userId),
    index('idx_auth_session_family_idle_expires_at').on(table.idleExpiresAt),
    index('idx_auth_session_family_absolute_expires_at').on(table.absoluteExpiresAt),
  ],
).enableRLS()

export const authSessionTokenTable = pgTable(
  'auth_session_token',
  {
    id: uuid('id').primaryKey(),
    familyId: uuid('family_id')
      .references(() => authSessionFamilyTable.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    replacedByTokenId: uuid('replaced_by_token_id'),
    rotatedAt: timestamp('rotated_at', { precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_auth_session_token_family_id').on(table.familyId),
    index('idx_auth_session_token_replaced_by_token_id').on(table.replacedByTokenId),
    uniqueIndex('idx_auth_session_token_token_hash').on(table.tokenHash),
    foreignKey({
      name: 'fk_auth_session_token_repl',
      columns: [table.replacedByTokenId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
  ],
).enableRLS()
