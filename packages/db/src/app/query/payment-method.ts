import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { paymentMethodTable } from '../schema/subscription'

export interface SavePaymentMethodInput {
  userId: number
  token: string
  method: string | null
  brand: string | null
  cardLast4: string | null
}

export async function savePaymentMethod(input: SavePaymentMethodInput): Promise<{ id: number } | undefined> {
  const [row] = await db
    .insert(paymentMethodTable)
    .values({
      userId: input.userId,
      token: input.token,
      method: input.method,
      brand: input.brand,
      cardLast4: input.cardLast4,
    })
    .onConflictDoUpdate({
      target: [paymentMethodTable.provider, paymentMethodTable.token],
      set: {
        method: input.method,
        brand: input.brand,
        cardLast4: input.cardLast4,
        status: 'active',
        updatedAt: new Date(),
      },
      setWhere: eq(paymentMethodTable.userId, input.userId),
    })
    .returning({ id: paymentMethodTable.id })

  return row
}

export interface PaymentMethodBrief {
  id: number
  brand: string | null
  cardLast4: string | null
  createdAt: Date
}

export async function listActivePaymentMethods(userId: number): Promise<PaymentMethodBrief[]> {
  return db
    .select({
      id: paymentMethodTable.id,
      brand: paymentMethodTable.brand,
      cardLast4: paymentMethodTable.cardLast4,
      createdAt: paymentMethodTable.createdAt,
    })
    .from(paymentMethodTable)
    .where(and(eq(paymentMethodTable.userId, userId), eq(paymentMethodTable.status, 'active')))
    .orderBy(desc(paymentMethodTable.createdAt))
}

export interface PaymentMethodKey {
  id: number
  userId: number
}

export interface ChargeablePaymentMethod {
  id: number
  token: string
  method: string | null
}

export async function getActivePaymentMethodForUser({
  id,
  userId,
}: PaymentMethodKey): Promise<ChargeablePaymentMethod | undefined> {
  const [row] = await db
    .select({ id: paymentMethodTable.id, token: paymentMethodTable.token, method: paymentMethodTable.method })
    .from(paymentMethodTable)
    .where(
      and(
        eq(paymentMethodTable.id, id),
        eq(paymentMethodTable.userId, userId),
        eq(paymentMethodTable.status, 'active'),
      ),
    )

  return row
}

export interface GetRenewalPaymentMethodInput {
  userId: number
  preferredId: number | null
}

// 갱신 청구용 결제수단 — 구독에 지정된 카드가 살아 있으면 그것을, 아니면 유저의 최근 active
// 카드를 고른다(옛 카드 삭제 → 새 카드 등록 흐름에서 갱신이 죽지 않도록).
export async function getRenewalPaymentMethod({
  userId,
  preferredId,
}: GetRenewalPaymentMethodInput): Promise<ChargeablePaymentMethod | undefined> {
  const [row] = await db
    .select({ id: paymentMethodTable.id, token: paymentMethodTable.token, method: paymentMethodTable.method })
    .from(paymentMethodTable)
    .where(and(eq(paymentMethodTable.userId, userId), eq(paymentMethodTable.status, 'active')))
    .orderBy(
      ...(preferredId === null ? [] : [desc(eq(paymentMethodTable.id, preferredId))]),
      desc(paymentMethodTable.createdAt),
    )
    .limit(1)

  return row
}

export async function markPaymentMethodDeletedByToken(token: string): Promise<void> {
  await db
    .update(paymentMethodTable)
    .set({ status: 'deleted' })
    .where(
      and(
        eq(paymentMethodTable.provider, 'portone'),
        eq(paymentMethodTable.token, token),
        eq(paymentMethodTable.status, 'active'),
      ),
    )
}

// 삭제 마킹과 revoke용 토큰 조회를 한 문장으로 — 삭제된 카드의 토큰을 반환한다(없으면 undefined).
export async function markPaymentMethodDeleted({
  id,
  userId,
}: PaymentMethodKey): Promise<{ token: string } | undefined> {
  const [row] = await db
    .update(paymentMethodTable)
    .set({ status: 'deleted' })
    .where(
      and(
        eq(paymentMethodTable.id, id),
        eq(paymentMethodTable.userId, userId),
        eq(paymentMethodTable.status, 'active'),
      ),
    )
    .returning({ token: paymentMethodTable.token })

  return row
}
