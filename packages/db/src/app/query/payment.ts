import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { paymentTable } from '../schema/payment'

export type PaymentRow = typeof paymentTable.$inferSelect

export interface CreatePendingPaymentInput {
  paymentId: string
  userId: number
  orderName: string
  amount: number
  currency?: string
  targetType?: string | null
  targetId?: number | null
  periodStart?: Date | null
  periodEnd?: Date | null
}

// 클라이언트(브라우저/앱)에서 보내는 금액 정보는 위변조될 수 있으므로 절대 신뢰해서는 안 됩니다.
// 이 레코드는 서버가 의도한 '진짜 가격'을 미리 DB에 기록해두는 역할을 하며,
// 이후 결제 승인(Confirmation) 단계에서 PG사가 전달한 실제 결제 금액과 대조하여 검증하는 데 사용됩니다.
export async function createPendingPayment(input: CreatePendingPaymentInput): Promise<void> {
  await db.insert(paymentTable).values({
    paymentId: input.paymentId,
    userId: input.userId,
    orderName: input.orderName,
    amount: input.amount,
    currency: input.currency ?? 'KRW',
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
  })
}

export async function getPaymentByPaymentId(paymentId: string): Promise<PaymentRow | null> {
  const [row] = await db.select().from(paymentTable).where(eq(paymentTable.paymentId, paymentId))
  return row ?? null
}

export async function markPaymentFailed(paymentId: string): Promise<void> {
  await db
    .update(paymentTable)
    .set({
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(and(eq(paymentTable.paymentId, paymentId), eq(paymentTable.status, 'pending')))
}
