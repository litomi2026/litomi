import {
  type POSTV1PointsDonationCreateResponse,
  PROBLEM,
  postV1PointsDonationCreateRequestSchema,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import {
  DONATION_RECIPIENT_TYPE,
  pointDonationRecipientTable,
  pointDonationTable,
  pointTransactionTable,
  userPointsTable,
} from '@litomi/db/app/points'
import { TRANSACTION_TYPE } from '@litomi/domain/points/model'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('json', postV1PointsDonationCreateRequestSchema),
)

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { totalAmount, recipients } = c.req.valid('json')
  const recipientKeys = new Set<string>()

  for (const recipient of recipients) {
    const key = `${recipient.type}:${recipient.value}`
    if (recipientKeys.has(key)) {
      return problemResponse(c, { problem: PROBLEM.DONATION_DUPLICATE_TARGET })
    }
    recipientKeys.add(key)
  }

  if (totalAmount < recipients.length) {
    return problemResponse(c, { problem: PROBLEM.DONATION_AMOUNT_TOO_SMALL })
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
      return problemResponse(c, { problem: PROBLEM.INSUFFICIENT_POINTS })
    }

    return c.json({
      balance: result.balance,
      donationId: result.donationId,
      totalAmount,
      recipients: distribution,
    } satisfies POSTV1PointsDonationCreateResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
