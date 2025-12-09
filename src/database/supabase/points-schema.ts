import { bigint, boolean, index, pgTable, smallint, timestamp, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './schema'

export const adImpressionTokenTable = pgTable(
  'ad_impression_token',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    adSlotId: varchar('ad_slot_id', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    usedAt: timestamp('used_at', { precision: 3, withTimezone: true }),
    isUsed: boolean('is_used').notNull().default(false),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_ad_impression_token_user').on(table.userId),
    index('idx_ad_impression_token_token').on(table.token),
  ],
).enableRLS()

export const userPointsTable = pgTable('user_points', {
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  totalEarned: bigint('total_earned', { mode: 'number' }).notNull().default(0),
  totalSpent: bigint('total_spent', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
}).enableRLS()

export const pointTransactionTable = pgTable(
  'point_transaction',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    type: smallint('type').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    description: varchar('description', { length: 100 }),
  },
  (table) => [index('idx_point_transaction_user_id').on(table.userId, table.createdAt.desc())],
).enableRLS()

export const userExpansionTable = pgTable(
  'user_expansion',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    type: smallint('type').notNull(),
    amount: smallint('amount').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_user_expansion_user_type').on(table.userId, table.type)],
).enableRLS()

export const userItemTable = pgTable(
  'user_item',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    type: smallint('type').notNull(),
    itemId: varchar('item_id', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    isActive: smallint('is_active').notNull().default(1),
  },
  (table) => [index('idx_user_item_user_type').on(table.userId, table.type)],
).enableRLS()
