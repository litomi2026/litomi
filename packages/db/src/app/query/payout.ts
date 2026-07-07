import type { SettlementWindow } from '@litomi/domain/payout/policy'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/domain/subscription/policy'
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql, sum } from 'drizzle-orm'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'
import { paymentRefundTable, paymentTable } from '../schema/payment'
import { payoutAccountTable, payoutTable } from '../schema/payout'

export type PayoutRow = typeof payoutTable.$inferSelect

export interface SettlementActivity {
  grossAmount: number
  refundAmount: number
  // 스냅샷 원장 기준 net 수수료 = 수납 결제의 수수료 합 − 환불분의 요율 비례 역산.
  feeAmount: number
}

export interface SettlementActivityOptions {
  artistId?: number
}

// 창(월) 안의 아티스트별 수납/환불 합계. 귀속은 invoice의 target 스냅샷 기준이라
// 팬이 탈퇴(subscription cascade)해도 정산에서 새지 않는다. artistId를 주면 그 아티스트만.
export async function sumSettlementActivity(
  window: SettlementWindow,
  options: SettlementActivityOptions = {},
): Promise<Map<number, SettlementActivity>> {
  const { artistId } = options
  const artistCondition = artistId === undefined ? [] : [eq(invoiceTable.targetId, artistId)]

  const payments = await db
    .select({
      artistId: invoiceTable.targetId,
      total: sum(paymentTable.amount),
      fee: sum(paymentTable.feeAmount),
    })
    .from(paymentTable)
    .innerJoin(invoiceTable, eq(invoiceTable.id, paymentTable.invoiceId))
    .where(
      and(
        eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        ...artistCondition,
        // 전액 환불되면 status가 refunded로 바뀌지만 수납(paidAt)은 그 달의 매출이다.
        inArray(paymentTable.status, ['paid', 'refunded']),
        gte(paymentTable.paidAt, window.periodStart),
        lt(paymentTable.paidAt, window.periodEnd),
      ),
    )
    .groupBy(invoiceTable.targetId)

  const refunds = await db
    .select({
      artistId: invoiceTable.targetId,
      total: sum(paymentRefundTable.amount),
      // 환불액 × 원 결제의 요율(bps) 합 — JS에서 /10000 trunc해 되돌릴 수수료를 구한다.
      feeReversedScaled: sql<string>`sum(${paymentRefundTable.amount} * coalesce(${paymentTable.feeBps}, 0))`,
    })
    .from(paymentRefundTable)
    .innerJoin(paymentTable, eq(paymentTable.id, paymentRefundTable.paymentId))
    .innerJoin(invoiceTable, eq(invoiceTable.id, paymentTable.invoiceId))
    .where(
      and(
        eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        ...artistCondition,
        gte(paymentRefundTable.refundedAt, window.periodStart),
        lt(paymentRefundTable.refundedAt, window.periodEnd),
      ),
    )
    .groupBy(invoiceTable.targetId)

  const activity = new Map<number, SettlementActivity>()

  for (const row of payments) {
    activity.set(row.artistId, {
      grossAmount: Number(row.total ?? 0),
      refundAmount: 0,
      feeAmount: Number(row.fee ?? 0),
    })
  }

  for (const row of refunds) {
    const refundAmount = Number(row.total ?? 0)
    const feeReversed = Math.trunc(Number(row.feeReversedScaled ?? 0) / 10_000)
    const entry = activity.get(row.artistId)

    if (entry) {
      entry.refundAmount = refundAmount
      entry.feeAmount -= feeReversed
    } else {
      activity.set(row.artistId, {
        grossAmount: 0,
        refundAmount,
        feeAmount: -feeReversed,
      })
    }
  }

  return activity
}

// 한 아티스트의 창(월) 수납/환불 합계 — 수익 대시보드의 진행 월 실시간 집계용.
export async function getSettlementActivityOfArtist(
  artistId: number,
  window: SettlementWindow,
): Promise<SettlementActivity> {
  const activity = await sumSettlementActivity(window, { artistId })

  return (
    activity.get(artistId) ?? {
      grossAmount: 0,
      refundAmount: 0,
      feeAmount: 0,
    }
  )
}

// 아티스트별 최신 payout 한 줄씩 — 월 마감의 이월(carried) 유입액과 마감 대상 산정용 일괄 조회.
export async function listLatestPayouts(): Promise<Map<number, LatestPayout>> {
  const rows = await db
    .selectDistinctOn([payoutTable.chatArtistId], {
      chatArtistId: payoutTable.chatArtistId,
      status: payoutTable.status,
      payableAmount: payoutTable.payableAmount,
    })
    .from(payoutTable)
    .where(isNotNull(payoutTable.chatArtistId))
    .orderBy(asc(payoutTable.chatArtistId), desc(payoutTable.periodStart))

  const latest = new Map<number, LatestPayout>()

  for (const row of rows) {
    if (row.chatArtistId !== null) {
      latest.set(row.chatArtistId, {
        status: row.status,
        payableAmount: row.payableAmount,
      })
    }
  }

  return latest
}

// 이월 체인의 앵커 — 최신 행이 carried일 때만 그 금액이 다음 달로 넘어간다.
export interface LatestPayout {
  status: PayoutRow['status']
  payableAmount: number
}

export interface CreatePayoutInput {
  chatArtistId: number
  userId: number | null
  periodStart: Date
  periodEnd: Date
  grossAmount: number
  refundAmount: number
  feeAmount: number
  withholdingAmount: number
  carriedInAmount: number
  payableAmount: number
  currency: string
  status: 'pending' | 'carried'
}

// 월 마감 멱등 생성 — 같은 (아티스트, 월)이 이미 있으면 아무것도 하지 않는다.
// userId null = 탈퇴한 아티스트의 잔여 정산(기록만 남고 지급 불가 — 계좌도 파기됨).
export async function createPayout(input: CreatePayoutInput): Promise<boolean> {
  const rows = await db
    .insert(payoutTable)
    .values(input)
    .onConflictDoNothing({
      target: [payoutTable.chatArtistId, payoutTable.periodStart],
    })
    .returning({ id: payoutTable.id })

  return rows.length > 0
}

export interface ListPayoutsOptions {
  limit?: number
}

export async function listPayoutsOfArtist(
  chatArtistId: number,
  options: ListPayoutsOptions = {},
): Promise<PayoutRow[]> {
  const { limit = 12 } = options

  return db
    .select()
    .from(payoutTable)
    .where(eq(payoutTable.chatArtistId, chatArtistId))
    .orderBy(desc(payoutTable.periodStart))
    .limit(limit)
}

export async function markPayoutPaid(payoutId: number, paidAt: Date): Promise<boolean> {
  const rows = await db
    .update(payoutTable)
    .set({ status: 'paid', paidAt })
    .where(and(eq(payoutTable.id, payoutId), eq(payoutTable.status, 'pending')))
    .returning({ id: payoutTable.id })

  return rows.length > 0
}

export interface PayoutAccountRow {
  bankName: string
  // 저장 시점에 암호화된 값 — 표시할 때 복호화·마스킹은 호출부 책임.
  accountNumber: string
  holderName: string
}

export async function getPayoutAccount(userId: number): Promise<PayoutAccountRow | undefined> {
  const [row] = await db
    .select({
      bankName: payoutAccountTable.bankName,
      accountNumber: payoutAccountTable.accountNumber,
      holderName: payoutAccountTable.holderName,
    })
    .from(payoutAccountTable)
    .where(eq(payoutAccountTable.userId, userId))

  return row
}

export interface UpsertPayoutAccountInput {
  userId: number
  bankName: string
  accountNumber: string
  holderName: string
}

export async function upsertPayoutAccount(input: UpsertPayoutAccountInput): Promise<void> {
  await db
    .insert(payoutAccountTable)
    .values(input)
    .onConflictDoUpdate({
      target: payoutAccountTable.userId,
      set: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        holderName: input.holderName,
      },
    })
}
