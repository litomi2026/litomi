import { and, desc, eq, sql, sum } from 'drizzle-orm'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'
import { paymentRefundTable, paymentTable } from '../schema/payment'
import { subscriptionTable } from '../schema/subscription'
import { paidThroughExpiry, type SubscriptionState, subscriptionStateColumns } from './subscription'

export interface RefundCandidate {
  paymentId: string
  amount: number
  paidAt: Date | null
  periodStart: Date
  periodEnd: Date
}

// 청약철회 후보 = 구독의 가장 최근 결제(현재 기간). paid invoice ⨝ paid payment.
export async function getLatestPaidInvoicePayment(subscriptionId: number): Promise<RefundCandidate | undefined> {
  const [row] = await db
    .select({
      paymentId: paymentTable.paymentId,
      amount: paymentTable.amount,
      paidAt: paymentTable.paidAt,
      periodStart: invoiceTable.periodStart,
      periodEnd: invoiceTable.periodEnd,
    })
    .from(invoiceTable)
    .innerJoin(paymentTable, eq(paymentTable.invoiceId, invoiceTable.id))
    .where(
      and(
        eq(invoiceTable.subscriptionId, subscriptionId),
        eq(invoiceTable.status, 'paid'),
        eq(paymentTable.status, 'paid'),
      ),
    )
    .orderBy(desc(invoiceTable.periodStart))
    .limit(1)

  return row
}

export interface RemoteRefund {
  providerRefundId: string
  amount: number
  reason: string | null
  refundedAt: Date
}

// 환불을 원장에 반영하고 invoice·subscription을 재계산한다. 반환값은 갱신된 구독 상태
// (구독과 무관한 결제 등으로 구독까지 닿지 못하면 undefined).
export async function applyPaymentRefunds(
  paymentId: string,
  refunds: RemoteRefund[],
): Promise<SubscriptionState | undefined> {
  if (refunds.length === 0) {
    return undefined
  }

  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select({
        id: paymentTable.id,
        amount: paymentTable.amount,
        currency: paymentTable.currency,
        invoiceId: paymentTable.invoiceId,
      })
      .from(paymentTable)
      .where(eq(paymentTable.paymentId, paymentId))

    if (!payment) {
      return undefined
    }

    await tx
      .insert(paymentRefundTable)
      .values(
        refunds.map((refund) => ({
          paymentId: payment.id,
          providerRefundId: refund.providerRefundId,
          amount: refund.amount,
          currency: payment.currency,
          reason: refund.reason,
          refundedAt: refund.refundedAt,
        })),
      )
      .onConflictDoNothing({ target: paymentRefundTable.providerRefundId })

    const [{ refundedTotal }] = await tx
      .select({ refundedTotal: sum(paymentRefundTable.amount) })
      .from(paymentRefundTable)
      .where(eq(paymentRefundTable.paymentId, payment.id))

    const fullyRefunded = Number(refundedTotal ?? 0) >= payment.amount
    const lastRefundedAt = new Date(Math.max(...refunds.map((refund) => refund.refundedAt.getTime())))

    if (fullyRefunded) {
      await tx
        .update(paymentTable)
        .set({
          status: 'refunded',
          refundedAt: lastRefundedAt,
        })
        .where(and(eq(paymentTable.id, payment.id), eq(paymentTable.status, 'paid')))
    }

    if (payment.invoiceId === null) {
      return undefined
    }

    // 재시도(웹훅이 먼저 반영한 경우 등)에도 같은 결과로 수렴하도록 status 조건 없이 갱신한다.
    const [invoice] = fullyRefunded
      ? await tx
          .update(invoiceTable)
          .set({ status: 'void' })
          .where(eq(invoiceTable.id, payment.invoiceId))
          .returning({ subscriptionId: invoiceTable.subscriptionId })
      : await tx
          .update(invoiceTable)
          .set({
            periodEnd: sql`greatest(${invoiceTable.periodStart}, least(${invoiceTable.periodEnd}, ${lastRefundedAt.toISOString()}::timestamptz))`,
          })
          .where(eq(invoiceTable.id, payment.invoiceId))
          .returning({ subscriptionId: invoiceTable.subscriptionId })

    if (!invoice || invoice.subscriptionId === null) {
      return undefined
    }

    // 만료는 invoice 원장에서 파생 — 남은 paid 기간이 없으면(전액 환불) 즉시 canceled로 수렴.
    const expiry = paidThroughExpiry(invoice.subscriptionId)

    const [subscription] = await tx
      .update(subscriptionTable)
      .set({
        autoRenew: false,
        expiresAt: expiry,
        status: sql`case when ${expiry} <= now() then 'canceled' else ${subscriptionTable.status} end`,
      })
      .where(eq(subscriptionTable.id, invoice.subscriptionId))
      .returning(subscriptionStateColumns)

    return subscription
  })
}
