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

export const trustedDeviceTable = pgTable(
  'trusted_device',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    deviceId: text('device_id').notNull(),
    deviceName: text('device_name'),
    userAgent: text('user_agent'),
    ipHash: varchar('ip_hash', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // Trusted device expiration
  },
  (table) => [
    index('idx_trusted_device_user_id').on(table.userId),
    index('idx_trusted_device_device_id').on(table.deviceId),
    unique('idx_trusted_device_unique').on(table.userId, table.deviceId),
  ],
).enableRLS()
