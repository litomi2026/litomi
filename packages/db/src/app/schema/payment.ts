import { sql } from 'drizzle-orm'
import { bigint, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { invoiceTable } from './invoice'
import { userTable } from './user'

export const paymentProviderEnum = pgEnum('payment_provider', ['portone'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])

export const paymentTable = pgTable(
  'payment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }).references(() => userTable.id, { onDelete: 'set null' }),
    invoiceId: bigint('invoice_id', { mode: 'number' }).references(() => invoiceTable.id, { onDelete: 'set null' }),
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
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
    uniqueIndex('uq_payment_invoice_pending').on(table.invoiceId).where(sql`status = 'pending'`),
    uniqueIndex('uq_payment_provider_txn').on(table.provider, table.providerTxnId),
  ],
).enableRLS()
