import { bigint, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core'

import { userTable } from './user'

export const twoFactorTable = pgTable('two_factor', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  secret: text().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS()

export const twoFactorBackupCodeTable = pgTable(
  'two_factor_backup_code',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => twoFactorTable.userId, { onDelete: 'cascade' })
      .notNull(),
    codeHash: text('code_hash').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.codeHash] })],
).enableRLS()

export const trustedBrowserTable = pgTable(
  'trusted_browser',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => twoFactorTable.userId, { onDelete: 'cascade' })
      .notNull(),
    browserId: text('browser_id').notNull(),
    browserName: text('browser_name'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('idx_trusted_browser_unique').on(table.userId, table.browserId)],
).enableRLS()
