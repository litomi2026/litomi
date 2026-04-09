import { bigint, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

// TODO: 2026-05-09 시점에 삭제
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

export const authSessionFamilyTable = pgTable(
  'auth_session_family',
  {
    id: uuid('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', { precision: 3, withTimezone: true }).notNull(),
    idleExpiresAt: timestamp('idle_expires_at', { precision: 3, withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { precision: 3, withTimezone: true }),
    userAgent: varchar('user_agent', { length: 512 }),
    ipAddress: varchar('ip_address', { length: 64 }),
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
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    rotatedAt: timestamp('rotated_at', { precision: 3, withTimezone: true }),
    replacedByTokenId: uuid('replaced_by_token_id'),
  },
  (table) => [
    index('idx_auth_session_token_family_id').on(table.familyId),
    index('idx_auth_session_token_replaced_by_token_id').on(table.replacedByTokenId),
    uniqueIndex('idx_auth_session_token_token_hash').on(table.tokenHash),
  ],
).enableRLS()
