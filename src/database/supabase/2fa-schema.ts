import { bigint, index, pgTable, primaryKey, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

import { userTable } from './schema'

export const twoFactorTable = pgTable('two_factor', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  secret: text().notNull(),
}).enableRLS()

export const twoFactorBackupCodeTable = pgTable(
  'two_factor_backup_code',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    codeHash: text('code_hash').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.codeHash] })],
).enableRLS()

export const trustedBrowserTable = pgTable(
  'trusted_browser',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    browserId: text('browser_id').notNull(),
    browserName: text('browser_name'),
    userAgent: text('user_agent'),
    ipHash: varchar('ip_hash', { length: 64 }),
  },
  (table) => [
    index('idx_trusted_browser_user_id').on(table.userId),
    index('idx_trusted_browser_browser_id').on(table.browserId),
    unique('idx_trusted_browser_unique').on(table.userId, table.browserId),
  ],
).enableRLS()
