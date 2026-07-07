import { bigint, boolean, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '../../columns'
import { userTable } from './user'

export const paymentMethodProviderEnum = pgEnum('payment_method_provider', ['portone'])
export const paymentMethodStatusEnum = pgEnum('payment_method_status', ['active', 'deleted'])

export const paymentMethodTable = pgTable.withRLS(
  'payment_method',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    provider: paymentMethodProviderEnum().notNull().default('portone'),
    // The provider's recurring-charge token; charges are made server-side against it.
    token: varchar('token', { length: 256 }).notNull(),
    // Normalized instrument kind (card | easyPay | …), copied onto the payment ledger at confirm.
    method: varchar({ length: 32 }),
    // Display-only metadata for the "결제수단" UI (card/easy-pay brand name, e.g. 현대카드).
    brand: varchar({ length: 64 }),
    cardLast4: varchar('card_last4', { length: 4 }),
    status: paymentMethodStatusEnum().notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_payment_method_provider').on(table.provider, table.token),
    index('idx_payment_method_user').on(table.userId, table.status),
  ],
)

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'incomplete',
  'active',
  'past_due',
  'canceled',
  'expired',
])

export const subscriptionTable = pgTable.withRLS(
  'subscription',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    targetType: varchar('target_type', { length: 32 }).notNull(),
    targetId: bigint('target_id', { mode: 'number' }).notNull(),
    paymentMethodId: bigint('payment_method_id', { mode: 'number' }).references(() => paymentMethodTable.id, {
      onDelete: 'set null',
    }),
    priceAmount: bigint('price_amount', { mode: 'number' }).notNull(),
    priceCurrency: varchar('price_currency', { length: 3 }).notNull().default('KRW'),
    status: subscriptionStatusEnum().notNull().default('incomplete'),
    autoRenew: boolean('auto_renew').notNull().default(true),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    // 자동갱신이 꺼진(취소 요청·환불·아티스트 이탈) 시각 — 자발/비자발 churn 분석의 유일한
    // 비파생 신호(autoRenew는 이력이 없다). 재개(autoRenew=true) 시 null로 되돌린다.
    canceledAt: timestamp('canceled_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_subscription_user_target').on(table.userId, table.targetType, table.targetId),
    index('idx_subscription_target').on(table.targetType, table.targetId, table.status),
    index('idx_subscription_expires_at').on(table.expiresAt),
  ],
)
