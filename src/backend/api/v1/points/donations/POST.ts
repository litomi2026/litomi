import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import {
  DONATION_RECIPIENT_TYPE,
  pointDonationRecipientTable,
  pointDonationTable,
  pointTransactionTable,
  userPointsTable,
} from '@/database/supabase/points'

const route = new Hono<Env>()

const createSchema = z.object({
  totalAmount: z.coerce.number().int().positive(),
  recipients: z
    .array(
      z.object({
        type: z.enum(['artist', 'group']),
        value: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(20),
})

export type POSTV1PointsDonationCreateRequest = z.infer<typeof createSchema>

export type POSTV1PointsDonationCreateResponse = {
  balance: number
  donationId: number
  totalAmount: number
  recipients: Array<{ type: 'artist' | 'group'; value: string; amount: number }>
}

route.post('/', requireAuth, zProblemValidator('json', createSchema), async (c) => {
  const userId = c.get('userId')!
  const { totalAmount, recipients } = c.req.valid('json')
  const recipientKeys = new Set<string>()

  for (const recipient of recipients) {
    const key = `${recipient.type}:${recipient.value}`
    if (recipientKeys.has(key)) {
      return problemResponse(c, { status: 400, detail: '기부 대상이 중복돼요' })
    }
    recipientKeys.add(key)
  }

  if (totalAmount < recipients.length) {
    return problemResponse(c, { status: 400, detail: '기부 금액이 너무 적어요' })
  }

  const perRecipient = Math.floor(totalAmount / recipients.length)
  const remainder = totalAmount % recipients.length
  const distribution = recipients.map((r, i) => ({ ...r, amount: i === 0 ? perRecipient + remainder : perRecipient }))

  try {
    const result = await db.transaction(async (tx) => {
      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points || points.balance < totalAmount) {
        return { ok: false as const }
      }

      const newBalance = points.balance - totalAmount

      await tx
        .update(userPointsTable)
        .set({
          balance: newBalance,
          totalSpent: sql`${userPointsTable.totalSpent} + ${totalAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(userPointsTable.userId, userId))

      const [transaction] = await tx
        .insert(pointTransactionTable)
        .values({
          userId,
          type: TRANSACTION_TYPE.DONATION,
          amount: -totalAmount,
          balanceAfter: newBalance,
        })
        .returning({ id: pointTransactionTable.id })

      const [donation] = await tx
        .insert(pointDonationTable)
        .values({
          userId,
          pointTransactionId: transaction.id,
        })
        .returning({ id: pointDonationTable.id })

      await tx.insert(pointDonationRecipientTable).values(
        distribution.map((d) => ({
          pointTransactionId: transaction.id,
          recipientType: d.type === 'artist' ? DONATION_RECIPIENT_TYPE.ARTIST : DONATION_RECIPIENT_TYPE.GROUP,
          recipientValue: d.value,
          amount: d.amount,
        })),
      )

      return {
        ok: true,
        balance: newBalance,
        donationId: donation.id,
      }
    })

    if (!result.ok) {
      return problemResponse(c, { status: 400, detail: '리보가 부족해요' })
    }

    return c.json<POSTV1PointsDonationCreateResponse>({
      balance: result.balance,
      donationId: result.donationId,
      totalAmount,
      recipients: distribution,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '기부에 실패했어요' })
  }
})

export default route
