import { bigint, index, pgEnum, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '../../columns'
import { chatArtistTable } from './chat'
import { userTable } from './user'

// pending = 지급 대기(운영자 수동 이체 후 paid 처리), carried = 최소 정산액 미달·0 이하로 익월 이월.
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid', 'carried'])

// 아티스트 월 정산 원장 — 달력월(KST) 마감으로 billing-worker가 생성한다(아티스트×월당 1행).
// 산식: 수납(gross) − 환불(refund) → 수수료 25% → 원천징수 3.3%(사업소득) → ±이월 = 실지급.
// FK는 SET NULL: 재무 기록은 계정/프로필 삭제 후에도 보존한다(전자상거래 5년 보관).
export const payoutTable = pgTable.withRLS(
  'payout',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    chatArtistId: bigint('chat_artist_id', { mode: 'number' }).references(() => chatArtistTable.id, {
      onDelete: 'set null',
    }),
    userId: bigint('user_id', { mode: 'number' }).references(() => userTable.id, { onDelete: 'set null' }),
    periodStart: timestamp('period_start', { precision: 3, withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { precision: 3, withTimezone: true }).notNull(),
    grossAmount: bigint('gross_amount', { mode: 'number' }).notNull(),
    refundAmount: bigint('refund_amount', { mode: 'number' }).notNull(),
    feeAmount: bigint('fee_amount', { mode: 'number' }).notNull(),
    withholdingAmount: bigint('withholding_amount', { mode: 'number' }).notNull(),
    carriedInAmount: bigint('carried_in_amount', { mode: 'number' }).notNull(),
    payableAmount: bigint('payable_amount', { mode: 'number' }).notNull(),
    currency: varchar({ length: 3 }).notNull().default('KRW'),
    status: payoutStatusEnum().notNull(),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_payout_artist_period').on(table.chatArtistId, table.periodStart),
    index('idx_payout_status').on(table.status),
  ],
)

// 정산 입금 계좌 — 수동 이체용. 계좌번호는 AES 암호화 저장(secret-crypto), 탈퇴 시 cascade 파기.
export const payoutAccountTable = pgTable.withRLS('payout_account', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('user_id', { mode: 'number' })
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  bankName: varchar('bank_name', { length: 32 }).notNull(),
  accountNumber: varchar('account_number', { length: 256 }).notNull(),
  holderName: varchar('holder_name', { length: 32 }).notNull(),
  ...timestamps,
})
