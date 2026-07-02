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

export async function getActivePaymentMethodForUser(
  id: number,
  userId: number,
): Promise<{ id: number; token: string; method: string | null } | undefined> {
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

export async function getPaymentMethodToken(id: number): Promise<{ token: string; method: string | null } | undefined> {
  const [row] = await db
    .select({ token: paymentMethodTable.token, method: paymentMethodTable.method })
    .from(paymentMethodTable)
    .where(and(eq(paymentMethodTable.id, id), eq(paymentMethodTable.status, 'active')))

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

export async function markPaymentMethodDeleted(id: number, userId: number): Promise<boolean> {
  const updated = await db
    .update(paymentMethodTable)
    .set({ status: 'deleted' })
    .where(
      and(
        eq(paymentMethodTable.id, id),
        eq(paymentMethodTable.userId, userId),
        eq(paymentMethodTable.status, 'active'),
      ),
    )
    .returning({ id: paymentMethodTable.id })

  return updated.length > 0
}
