import { sql } from 'drizzle-orm'
import { bigint, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { subscriptionTable } from './subscription'
import { userTable } from './user'

export const invoiceStatusEnum = pgEnum('invoice_status', ['open', 'paid', 'void'])

export const invoiceTable = pgTable(
  'invoice',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // SET NULL (not cascade): the period+amount snapshot is a financial record that must
    // survive account deletion for the 5-year e-commerce retention window.
    subscriptionId: bigint('subscription_id', { mode: 'number' }).references(() => subscriptionTable.id, {
      onDelete: 'set null',
    }),
    userId: bigint('user_id', { mode: 'number' }).references(() => userTable.id, { onDelete: 'set null' }),
    // The entitlement window this invoice grants once paid.
    periodStart: timestamp('period_start', { precision: 3, withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { precision: 3, withTimezone: true }).notNull(),
    // Server-owned price for this period, snapshotted at issue time (the client never sends it).
    amount: bigint({ mode: 'number' }).notNull(),
    currency: varchar({ length: 3 }).notNull().default('KRW'),
    status: invoiceStatusEnum().notNull().default('open'),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_invoice_open').on(table.subscriptionId).where(sql`status = 'open'`),
    uniqueIndex('uq_invoice_subscription_period').on(table.subscriptionId, table.periodStart),
    index('idx_invoice_subscription_status').on(table.subscriptionId, table.status),
    index('idx_invoice_user').on(table.userId),
  ],
).enableRLS()
