import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { paymentTable } from '../schema/payment'

export type PaymentRow = typeof paymentTable.$inferSelect

export async function createPendingPayment(input: {
  paymentId: string
  userId: number
  orderName: string
  amount: number
  currency?: string
}): Promise<void> {
  await db.insert(paymentTable).values({
    paymentId: input.paymentId,
    userId: input.userId,
    orderName: input.orderName,
    amount: input.amount,
    currency: input.currency ?? 'KRW',
  })
}

export async function ensureInvoicePayment(input: {
  invoiceId: number
  userId: number
  orderName: string
  amount: number
  currency: string
}): Promise<{ paymentId: string }> {
  const [row] = await db
    .insert(paymentTable)
    .values({
      paymentId: crypto.randomUUID(),
      userId: input.userId,
      invoiceId: input.invoiceId,
      orderName: input.orderName,
      amount: input.amount,
      currency: input.currency,
    })
    .onConflictDoUpdate({
      target: paymentTable.invoiceId,
      targetWhere: sql`status = 'pending'`,
      set: { updatedAt: new Date() },
    })
    .returning({ paymentId: paymentTable.paymentId })

  return row
}

export async function getPaymentByPaymentId(paymentId: string): Promise<PaymentRow | null> {
  const [row] = await db.select().from(paymentTable).where(eq(paymentTable.paymentId, paymentId))
  return row ?? null
}

export async function markPaymentFailed(
  paymentId: string,
  failure: { code: string | null; message: string },
): Promise<void> {
  const { code, message } = failure

  await db
    .update(paymentTable)
    .set({
      status: 'failed',
      failureCode: code,
      failureMessage: message,
      updatedAt: new Date(),
    })
    .where(and(eq(paymentTable.paymentId, paymentId), eq(paymentTable.status, 'pending')))
}
