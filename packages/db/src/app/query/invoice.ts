import { and, eq, gt, sql } from 'drizzle-orm'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'

export interface OpenInvoice {
  id: number
  periodStart: Date
  periodEnd: Date
  amount: number
  currency: string
}

export async function ensureOpenInvoice(input: {
  subscriptionId: number
  userId: number
  periodStart: Date
  periodEnd: Date
  amount: number
  currency: string
}): Promise<OpenInvoice | null> {
  const covered = await db
    .select({ id: invoiceTable.id })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.subscriptionId, input.subscriptionId),
        eq(invoiceTable.status, 'paid'),
        gt(invoiceTable.periodEnd, input.periodStart),
      ),
    )
    .limit(1)

  if (covered.length > 0) {
    return null
  }

  const [row] = await db
    .insert(invoiceTable)
    .values({
      subscriptionId: input.subscriptionId,
      userId: input.userId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      amount: input.amount,
      currency: input.currency,
    })
    .onConflictDoUpdate({
      target: invoiceTable.subscriptionId,
      targetWhere: sql`status = 'open'`,
      set: { updatedAt: new Date() },
    })
    .returning({
      id: invoiceTable.id,
      periodStart: invoiceTable.periodStart,
      periodEnd: invoiceTable.periodEnd,
      amount: invoiceTable.amount,
      currency: invoiceTable.currency,
    })

  return row
}

export async function voidOpenInvoice(subscriptionId: number): Promise<void> {
  await db
    .update(invoiceTable)
    .set({ status: 'void' })
    .where(and(eq(invoiceTable.subscriptionId, subscriptionId), eq(invoiceTable.status, 'open')))
}
