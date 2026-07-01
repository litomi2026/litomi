import { bigint, boolean, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { userTable } from './user'

export const billingKeyProviderEnum = pgEnum('billing_key_provider', ['portone'])
export const billingKeyStatusEnum = pgEnum('billing_key_status', ['active', 'deleted'])

export const billingKeyTable = pgTable(
  'billing_key',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    provider: billingKeyProviderEnum().notNull().default('portone'),
    // The provider's recurring-charge token; charges are made server-side against it.
    billingKey: varchar('billing_key', { length: 256 }).notNull(),
    // Display-only metadata for the "결제수단" UI (card brand etc.).
    method: varchar({ length: 64 }),
    cardLast4: varchar('card_last4', { length: 4 }),
    status: billingKeyStatusEnum().notNull().default('active'),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_billing_key_provider').on(table.provider, table.billingKey),
    index('idx_billing_key_user').on(table.userId, table.status),
  ],
).enableRLS()

export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'canceled', 'expired'])

export const subscriptionTable = pgTable(
  'subscription',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    targetType: varchar('target_type', { length: 32 }).notNull(),
    targetId: bigint('target_id', { mode: 'number' }).notNull(),
    status: subscriptionStatusEnum().notNull().default('active'),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    autoRenew: boolean('auto_renew').notNull().default(true),
    billingKeyId: bigint('billing_key_id', { mode: 'number' }).references(() => billingKeyTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_subscription_user_target').on(table.userId, table.targetType, table.targetId),
    index('idx_subscription_target').on(table.targetType, table.targetId, table.status),
    index('idx_subscription_status_expires_at').on(table.status, table.expiresAt),
  ],
).enableRLS()
