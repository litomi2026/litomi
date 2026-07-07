import { RENEWAL_LEAD_MS } from '@litomi/domain/subscription/policy'
import { and, asc, eq, gt, inArray, lte, notInArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { invoiceTable } from '../schema/invoice'
import { paymentTable } from '../schema/payment'
import { subscriptionTable } from '../schema/subscription'

export type SubscriptionStatus = (typeof subscriptionTable.$inferSelect)['status']

export interface SubscriptionState {
  id: number
  status: SubscriptionStatus
  expiresAt: Date
  autoRenew: boolean
  paymentMethodId: number | null
}

export const subscriptionStateColumns = {
  id: subscriptionTable.id,
  status: subscriptionTable.status,
  expiresAt: subscriptionTable.expiresAt,
  autoRenew: subscriptionTable.autoRenew,
  paymentMethodId: subscriptionTable.paymentMethodId,
} as const

export interface SubscriptionKey {
  userId: number
  targetType: string
  targetId: number
}

export async function getSubscription(key: SubscriptionKey): Promise<SubscriptionState | undefined> {
  const [row] = await db.select(subscriptionStateColumns).from(subscriptionTable).where(subscriptionKeyCondition(key))

  return row
}

export async function setAutoRenew(key: SubscriptionKey, autoRenew: boolean): Promise<SubscriptionState | undefined> {
  const [row] = await db
    .update(subscriptionTable)
    .set({
      autoRenew,
      canceledAt: autoRenew ? null : new Date(),
    })
    .where(subscriptionKeyCondition(key))
    .returning(subscriptionStateColumns)

  return row
}

function subscriptionKeyCondition(key: SubscriptionKey) {
  return and(
    eq(subscriptionTable.userId, key.userId),
    eq(subscriptionTable.targetType, key.targetType),
    eq(subscriptionTable.targetId, key.targetId),
  )
}

// 열람권 프로젝션의 유일한 정의 — subscription.expiresAt는 invoice 원장 위의 파생 뷰다.
// 구독은 "가장 최근 paid invoice의 periodEnd까지" 열람권을 가진다. invoice의 paid 상태를
// 바꾸는 모든 경로는 expiresAt를 이 식으로만 세팅해, 정본(원장)과 워터마크(파생)가 어긋날 수
// 없게 한다. paid invoice가 하나도 없으면(전액 환불 등) now()로 바닥을 깔아 즉시 만료로 수렴한다.
export function paidThroughExpiry(subscriptionId: number) {
  return sql`coalesce((
    select max(${invoiceTable.periodEnd})
    from ${invoiceTable}
    where ${invoiceTable.subscriptionId} = ${subscriptionId}
      and ${invoiceTable.status} = 'paid'
  ), now())`
}

export interface ConfirmPaymentInput {
  providerTxnId: string
  paidAt: Date
  paymentMethodId: number | null
  method: string | null
}

export async function confirmPayment(paymentId: string, data: ConfirmPaymentInput): Promise<{ confirmed: boolean }> {
  const { providerTxnId, paidAt, paymentMethodId, method } = data

  return db.transaction(async (tx) => {
    const [paid] = await tx
      .update(paymentTable)
      .set({
        status: 'paid',
        providerTxnId,
        ...(method && { method }),
        paidAt,
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
      })
      .where(and(eq(invoiceTable.id, paid.invoiceId), inArray(invoiceTable.status, ['open', 'void'])))
      .returning({ subscriptionId: invoiceTable.subscriptionId })

    if (invoice && invoice.subscriptionId !== null) {
      const set: Record<string, unknown> = {
        status: 'active',
        autoRenew: true,
        canceledAt: null,
        expiresAt: paidThroughExpiry(invoice.subscriptionId),
      }

      if (paymentMethodId !== null) {
        set.paymentMethodId = paymentMethodId
      }

      await tx.update(subscriptionTable).set(set).where(eq(subscriptionTable.id, invoice.subscriptionId))
    }

    return { confirmed: true }
  })
}

// 무료(0원) invoice를 결제 없이 정산 처리 — invoice를 paid로, 구독을 active + 열람권 갱신.
// 무료 개방(가격 0)·무료 체험 공용. payment 행이 없으므로 정산 매출에도 잡히지 않는다.
export async function activateFreeInvoice(invoiceId: number, paidAt: Date): Promise<void> {
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .update(invoiceTable)
      .set({ status: 'paid', paidAt })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.status, 'open')))
      .returning({ subscriptionId: invoiceTable.subscriptionId })

    if (invoice && invoice.subscriptionId !== null) {
      await tx
        .update(subscriptionTable)
        .set({
          status: 'active',
          autoRenew: true,
          canceledAt: null,
          expiresAt: paidThroughExpiry(invoice.subscriptionId),
        })
        .where(eq(subscriptionTable.id, invoice.subscriptionId))
    }
  })
}

export interface EnsureSubscriptionInput {
  userId: number
  targetType: string
  targetId: number
  paymentMethodId: number | null
  priceAmount: number
  priceCurrency: string
  now: Date
}

export interface EnsureSubscriptionResult {
  id: number
  expiresAt: Date
}

export async function ensureSubscription(input: EnsureSubscriptionInput): Promise<EnsureSubscriptionResult> {
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
        canceledAt: null,
        updatedAt: input.now,
        priceAmount: input.priceAmount,
        priceCurrency: input.priceCurrency,
        ...(input.paymentMethodId !== null && { paymentMethodId: input.paymentMethodId }),
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

export interface ListSubscriptionsDueOptions {
  now: Date
  afterId?: number
  limit?: number
}

export async function listSubscriptionsDue(options: ListSubscriptionsDueOptions): Promise<DueSubscription[]> {
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
  await db.update(subscriptionTable).set({ status }).where(eq(subscriptionTable.id, id))
}
