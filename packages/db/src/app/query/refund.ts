import { and, eq, max, sql, sum } from 'drizzle-orm'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'
import { paymentRefundTable, paymentTable } from '../schema/payment'
import { subscriptionTable } from '../schema/subscription'

export interface RemoteRefund {
  providerRefundId: string
  amount: number
  reason: string | null
  refundedAt: Date
}

export async function applyPaymentRefunds(paymentId: string, refunds: RemoteRefund[]): Promise<void> {
  if (refunds.length === 0) {
    return
  }

  await db.transaction(async (tx) => {
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
      return
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
        .set({ status: 'refunded', refundedAt: lastRefundedAt, updatedAt: new Date() })
        .where(and(eq(paymentTable.id, payment.id), eq(paymentTable.status, 'paid')))
    }

    if (payment.invoiceId === null) {
      return
    }

    const [invoice] = fullyRefunded
      ? await tx
          .update(invoiceTable)
          .set({
            status: 'void',
            updatedAt: new Date(),
          })
          .where(and(eq(invoiceTable.id, payment.invoiceId), eq(invoiceTable.status, 'paid')))
          .returning({ subscriptionId: invoiceTable.subscriptionId })
      : await tx
          .update(invoiceTable)
          .set({
            periodEnd: sql`greatest(${invoiceTable.periodStart}, least(${invoiceTable.periodEnd}, ${lastRefundedAt}::timestamptz))`,
            updatedAt: new Date(),
          })
          .where(and(eq(invoiceTable.id, payment.invoiceId), eq(invoiceTable.status, 'paid')))
          .returning({ subscriptionId: invoiceTable.subscriptionId })

    if (!invoice || invoice.subscriptionId === null) {
      return
    }

    const [remaining] = await tx
      .select({ maxPeriodEnd: max(invoiceTable.periodEnd) })
      .from(invoiceTable)
      .where(and(eq(invoiceTable.subscriptionId, invoice.subscriptionId), eq(invoiceTable.status, 'paid')))

    const now = new Date()
    const expiresAt = remaining?.maxPeriodEnd ?? now

    await tx
      .update(subscriptionTable)
      .set({
        autoRenew: false,
        expiresAt,
        ...(expiresAt.getTime() <= now.getTime() && { status: 'canceled' as const }),
        updatedAt: now,
      })
      .where(eq(subscriptionTable.id, invoice.subscriptionId))
  })
}
