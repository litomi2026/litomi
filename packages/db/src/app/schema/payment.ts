import { bigint, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { userTable } from './user'

export const paymentProviderEnum = pgEnum('payment_provider', ['portone'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])

export const paymentTable = pgTable(
  'payment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // Our id handed to the PG as `paymentId`; also the idempotency anchor for confirmation.
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
    // The financial record must survive account deletion for tax/audit retention
    userId: bigint('user_id', { mode: 'number' }).references(() => userTable.id, { onDelete: 'set null' }),
    // What was bought (polymorphic; null for a generic/one-off purchase). e.g. 'chat_artist'.
    targetType: varchar('target_type', { length: 32 }),
    targetId: bigint('target_id', { mode: 'number' }),
    // Entitlement window this payment grants (null for non-subscription one-offs).
    periodStart: timestamp('period_start', { precision: 3, withTimezone: true }),
    periodEnd: timestamp('period_end', { precision: 3, withTimezone: true }),
    orderName: varchar('order_name', { length: 128 }).notNull(),
    // Smallest currency unit (minor units), à la Stripe: KRW won (₩1000 → 1000), USD cents ($10.00 → 1000)
    amount: bigint({ mode: 'number' }).notNull(),
    currency: varchar({ length: 3 }).notNull().default('KRW'),
    // The PSP/gateway we integrated with.
    provider: paymentProviderEnum().notNull().default('portone'),
    // The payment-method brand the user chose (card | kakaopay | alipay | wechatpay | …),
    // distinct from `provider`. Null until known (set at confirmation).
    method: varchar('method', { length: 32 }),
    // The PG's transaction id, set on confirmation (null while pending).
    providerTxnId: varchar('provider_txn_id', { length: 128 }),
    status: paymentStatusEnum().notNull().default('pending'),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    refundedAt: timestamp('refunded_at', { precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payment_user').on(table.userId),
    // Entitlement scan: "what did this user pay for this target?" (drives listPaidIntervals).
    index('idx_payment_target').on(table.targetType, table.targetId, table.userId),
    // One ledger row per PG transaction (NULLs are distinct, so many pending rows are fine).
    uniqueIndex('uq_payment_provider_txn').on(table.provider, table.providerTxnId),
  ],
).enableRLS()
