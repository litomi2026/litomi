import { and, asc, desc, eq, gt, lt, sql, sum } from 'drizzle-orm'
import { db } from '../db'
import { paymentRefundTable, paymentTable } from '../schema/payment'

export type PaymentRow = typeof paymentTable.$inferSelect

export interface CreatePendingPaymentInput {
  paymentId: string
  userId: number
  orderName: string
  amount: number
  currency?: string
}

export async function createPendingPayment(input: CreatePendingPaymentInput): Promise<void> {
  await db.insert(paymentTable).values({
    paymentId: input.paymentId,
    userId: input.userId,
    orderName: input.orderName,
    amount: input.amount,
    currency: input.currency ?? 'KRW',
  })
}

export interface EnsureInvoicePaymentInput {
  invoiceId: number
  userId: number
  orderName: string
  amount: number
  currency: string
}

export async function ensureInvoicePayment(input: EnsureInvoicePaymentInput): Promise<{ paymentId: string }> {
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

export async function getPaymentByPaymentId(paymentId: string): Promise<PaymentRow | undefined> {
  const [row] = await db.select().from(paymentTable).where(eq(paymentTable.paymentId, paymentId))
  return row
}

export interface PaymentHistoryRow {
  id: number
  paymentId: string
  orderName: string
  amount: number
  currency: string
  status: PaymentRow['status']
  method: string | null
  refundedAmount: number
  paidAt: Date | null
  createdAt: Date
}

export interface ListPaymentsOptions {
  beforeId?: number
  limit?: number
}

// 결제 허브의 결제 내역 — 최신순 keyset. 환불 합계는 행당 lateral 서브쿼리로 같은 쿼리에서
// 계산한다(상관 조건이 where에 있어 컬럼 한정자가 유지된다).
export async function listPaymentsOfUser(
  userId: number,
  options: ListPaymentsOptions = {},
): Promise<PaymentHistoryRow[]> {
  const { beforeId, limit = 20 } = options
  const conditions = [eq(paymentTable.userId, userId)]

  if (beforeId !== undefined) {
    conditions.push(lt(paymentTable.id, beforeId))
  }

  const refunds = db
    .select({ refundedAmount: sum(paymentRefundTable.amount).mapWith(Number).as('refunded_amount') })
    .from(paymentRefundTable)
    .where(eq(paymentRefundTable.paymentId, paymentTable.id))
    .as('refunds')

  const rows = await db
    .select({
      id: paymentTable.id,
      paymentId: paymentTable.paymentId,
      orderName: paymentTable.orderName,
      amount: paymentTable.amount,
      currency: paymentTable.currency,
      status: paymentTable.status,
      method: paymentTable.method,
      refundedAmount: refunds.refundedAmount,
      paidAt: paymentTable.paidAt,
      createdAt: paymentTable.createdAt,
    })
    .from(paymentTable)
    .leftJoinLateral(refunds, sql`true`)
    .where(and(...conditions))
    .orderBy(desc(paymentTable.id))
    .limit(limit)

  return rows.map((row) => ({ ...row, refundedAmount: Number(row.refundedAmount ?? 0) }))
}

export interface ListStalePendingPaymentsOptions {
  olderThan: Date
  afterId?: number
  limit?: number
}

export interface StalePendingPaymentRow {
  id: number
  paymentId: string
}

// charge 성공과 confirmPayment 사이에 프로세스가 죽고 웹훅까지 유실된 결제를 잡는
// 대사(reconcile) 스위퍼용 — 오래 pending인 것만 keyset으로 훑는다(idx_payment_pending_created).
export async function listStalePendingPayments(
  options: ListStalePendingPaymentsOptions,
): Promise<StalePendingPaymentRow[]> {
  const { olderThan, afterId = 0, limit = 200 } = options

  return db
    .select({ id: paymentTable.id, paymentId: paymentTable.paymentId })
    .from(paymentTable)
    .where(and(eq(paymentTable.status, 'pending'), lt(paymentTable.createdAt, olderThan), gt(paymentTable.id, afterId)))
    .orderBy(asc(paymentTable.id))
    .limit(limit)
}

export interface PaymentFailure {
  code: string | null
  message: string
}

export async function markPaymentFailed(paymentId: string, failure: PaymentFailure): Promise<void> {
  const { code, message } = failure

  await db
    .update(paymentTable)
    .set({
      status: 'failed',
      failureCode: code,
      failureMessage: message,
    })
    .where(and(eq(paymentTable.paymentId, paymentId), eq(paymentTable.status, 'pending')))
}
