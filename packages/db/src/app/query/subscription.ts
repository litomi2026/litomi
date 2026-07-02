import { and, asc, eq, gt, inArray, lte, notInArray, sql } from 'drizzle-orm'
import ms from 'ms'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'
import { paymentTable } from '../schema/payment'
import { subscriptionTable } from '../schema/subscription'

export type SubscriptionStatus = (typeof subscriptionTable.$inferSelect)['status']

export const SUBSCRIPTION_TARGET_CHAT_ARTIST = 'chat_artist'
export const RENEWAL_LEAD_MS = ms('1 day')
export const RENEWAL_GRACE_MS = ms('3 days')

export function addSubscriptionPeriod(from: Date): Date {
  const next = new Date(from)
  const day = next.getUTCDate()
  next.setUTCMonth(next.getUTCMonth() + 1)

  if (next.getUTCDate() < day) {
    next.setUTCDate(0)
  }

  return next
}

export interface SubscriptionState {
  status: SubscriptionStatus
  expiresAt: Date
  autoRenew: boolean
  paymentMethodId: number | null
}

const stateColumns = {
  status: subscriptionTable.status,
  expiresAt: subscriptionTable.expiresAt,
  autoRenew: subscriptionTable.autoRenew,
  paymentMethodId: subscriptionTable.paymentMethodId,
} as const

export async function getSubscription(
  userId: number,
  targetType: string,
  targetId: number,
): Promise<SubscriptionState | null> {
  const [row] = await db
    .select(stateColumns)
    .from(subscriptionTable)
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, targetType),
        eq(subscriptionTable.targetId, targetId),
      ),
    )

  return row ?? null
}

export async function setAutoRenew(
  userId: number,
  targetType: string,
  targetId: number,
  autoRenew: boolean,
): Promise<SubscriptionState | null> {
  const [row] = await db
    .update(subscriptionTable)
    .set({
      autoRenew,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, targetType),
        eq(subscriptionTable.targetId, targetId),
      ),
    )
    .returning(stateColumns)

  return row ?? null
}

export async function confirmPayment(
  paymentId: string,
  data: { providerTxnId: string; paidAt: Date; paymentMethodId: number | null; method: string | null },
): Promise<{ confirmed: boolean }> {
  const { providerTxnId, paidAt, paymentMethodId, method } = data

  return db.transaction(async (tx) => {
    const [paid] = await tx
      .update(paymentTable)
      .set({
        status: 'paid',
        providerTxnId,
        ...(method && { method }),
        paidAt,
        updatedAt: new Date(),
      })
      .where(and(eq(paymentTable.paymentId, paymentId), eq(paymentTable.status, 'pending')))
      .returning({ invoiceId: paymentTable.invoiceId })

    if (!paid) {
      return { confirmed: false }
    }

    if (paid.invoiceId === null) {
      return { confirmed: true }
    }

    const [invoice] = await tx
      .update(invoiceTable)
      .set({
        status: 'paid',
        paidAt,
        updatedAt: new Date(),
      })
      .where(and(eq(invoiceTable.id, paid.invoiceId), inArray(invoiceTable.status, ['open', 'void'])))
      .returning({
        subscriptionId: invoiceTable.subscriptionId,
        periodEnd: invoiceTable.periodEnd,
      })

    if (invoice && invoice.subscriptionId !== null) {
      const set: Record<string, unknown> = {
        status: 'active',
        autoRenew: true,
        expiresAt: sql`greatest(${subscriptionTable.expiresAt}, ${invoice.periodEnd}::timestamptz)`,
        updatedAt: new Date(),
      }

      if (paymentMethodId !== null) {
        set.paymentMethodId = paymentMethodId
      }

      await tx.update(subscriptionTable).set(set).where(eq(subscriptionTable.id, invoice.subscriptionId))
    }

    return { confirmed: true }
  })
}

export async function ensureSubscription(input: {
  userId: number
  targetType: string
  targetId: number
  paymentMethodId: number | null
  priceAmount: number
  priceCurrency: string
  now: Date
}): Promise<{ id: number; expiresAt: Date }> {
  const [row] = await db
    .insert(subscriptionTable)
    .values({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      paymentMethodId: input.paymentMethodId,
      priceAmount: input.priceAmount,
      priceCurrency: input.priceCurrency,
      status: 'incomplete',
      autoRenew: true,
      expiresAt: input.now,
    })
    .onConflictDoUpdate({
      target: [subscriptionTable.userId, subscriptionTable.targetType, subscriptionTable.targetId],
      set: {
        autoRenew: true,
        ...(input.paymentMethodId !== null && { paymentMethodId: input.paymentMethodId }),
        priceAmount: input.priceAmount,
        priceCurrency: input.priceCurrency,
        updatedAt: input.now,
      },
    })
    .returning({ id: subscriptionTable.id, expiresAt: subscriptionTable.expiresAt })

  return row
}

export interface DueSubscription {
  id: number
  userId: number
  targetType: string
  targetId: number
  status: SubscriptionStatus
  expiresAt: Date
  autoRenew: boolean
  paymentMethodId: number | null
  priceAmount: number
  priceCurrency: string
}

export async function listSubscriptionsDue(options: {
  now: Date
  afterId?: number
  limit?: number
}): Promise<DueSubscription[]> {
  const { now, afterId = 0, limit = 1000 } = options
  const dueBefore = new Date(now.getTime() + RENEWAL_LEAD_MS)

  return db
    .select({
      id: subscriptionTable.id,
      userId: subscriptionTable.userId,
      targetType: subscriptionTable.targetType,
      targetId: subscriptionTable.targetId,
      status: subscriptionTable.status,
      expiresAt: subscriptionTable.expiresAt,
      autoRenew: subscriptionTable.autoRenew,
      paymentMethodId: subscriptionTable.paymentMethodId,
      priceAmount: subscriptionTable.priceAmount,
      priceCurrency: subscriptionTable.priceCurrency,
    })
    .from(subscriptionTable)
    .where(
      and(
        notInArray(subscriptionTable.status, ['incomplete', 'expired', 'canceled']),
        lte(subscriptionTable.expiresAt, dueBefore),
        gt(subscriptionTable.id, afterId),
      ),
    )
    .orderBy(asc(subscriptionTable.id))
    .limit(limit)
}

export async function markSubscriptionStatus(id: number, status: SubscriptionStatus): Promise<void> {
  await db
    .update(subscriptionTable)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionTable.id, id))
}
