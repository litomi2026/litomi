import { and, desc, eq, inArray, lt, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import {
  DONATION_RECIPIENT_TYPE,
  pointDonationRecipientTable,
  pointDonationTable,
  pointTransactionTable,
} from '@/database/supabase/points'
import { translateArtistList } from '@/translation/artist'
import { translateGroupList } from '@/translation/group'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

const route = new Hono<Env>()

const recipientQuerySchema = z.object({
  type: z.enum(['artist', 'group']),
  value: z.string().min(1),
})

export type GETV1PointsDonationRecipientResponse = {
  totalReceived: number
}

const publicDailyCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('1 day'),
})

route.get('/recipient', zProblemValidator('query', recipientQuerySchema), async (c) => {
  const { type, value } = c.req.valid('query')
  const recipientValue = value.trim()
  const recipientType = type === 'artist' ? DONATION_RECIPIENT_TYPE.ARTIST : DONATION_RECIPIENT_TYPE.GROUP

  try {
    const [row] = await db
      .select({ total: sum(pointDonationRecipientTable.amount) })
      .from(pointDonationRecipientTable)
      .where(
        and(
          eq(pointDonationRecipientTable.recipientType, recipientType),
          eq(pointDonationRecipientTable.recipientValue, recipientValue),
        ),
      )

    return c.json<GETV1PointsDonationRecipientResponse>(
      { totalReceived: Number(row?.total ?? 0) },
      { headers: { 'Cache-Control': publicDailyCacheControl } },
    )
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '기부 정보를 불러오지 못했어요' })
  }
})

const meQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
})

export type GETV1PointsDonationsMeItem = {
  id: number
  totalAmount: number
  createdAt: string
  recipients: GETV1PointsDonationsMeRecipient[]
}

export type GETV1PointsDonationsMeRecipient = {
  type: 'artist' | 'group'
  value: string
  label: string
  amount: number
}

export type GETV1PointsDonationsMeResponse = {
  items: GETV1PointsDonationsMeItem[]
  nextCursor: number | null
}

const PER_PAGE = 20

route.get('/me', requireAuth, zProblemValidator('query', meQuerySchema), async (c) => {
  const userId = c.get('userId')!
  const { cursor } = c.req.valid('query')

  const whereConditions = cursor
    ? and(eq(pointDonationTable.userId, userId), lt(pointDonationTable.id, cursor))
    : eq(pointDonationTable.userId, userId)

  try {
    const donations = await db
      .select({
        id: pointDonationTable.id,
        pointTransactionId: pointDonationTable.pointTransactionId,
        totalAmount: pointTransactionTable.amount,
        createdAt: pointTransactionTable.createdAt,
      })
      .from(pointDonationTable)
      .innerJoin(pointTransactionTable, eq(pointDonationTable.pointTransactionId, pointTransactionTable.id))
      .where(whereConditions)
      .orderBy(desc(pointDonationTable.id))
      .limit(PER_PAGE + 1)

    const hasMore = donations.length > PER_PAGE

    if (hasMore) {
      donations.pop()
    }

    const transactionIds = donations.map((d) => d.pointTransactionId)
    const recipients = transactionIds.length
      ? await db
          .select({
            pointTransactionId: pointDonationRecipientTable.pointTransactionId,
            recipientType: pointDonationRecipientTable.recipientType,
            recipientValue: pointDonationRecipientTable.recipientValue,
            amount: pointDonationRecipientTable.amount,
          })
          .from(pointDonationRecipientTable)
          .where(inArray(pointDonationRecipientTable.pointTransactionId, transactionIds))
      : []

    const artistValueSet = new Set<string>()
    const groupValueSet = new Set<string>()

    for (const r of recipients) {
      if (r.recipientType === DONATION_RECIPIENT_TYPE.ARTIST) {
        artistValueSet.add(r.recipientValue)
      } else {
        groupValueSet.add(r.recipientValue)
      }
    }

    const artistLabelMap = new Map<string, string>()
    for (const item of translateArtistList([...artistValueSet], 'ko') ?? []) {
      artistLabelMap.set(item.value, item.label)
    }

    const groupLabelMap = new Map<string, string>()
    for (const item of translateGroupList([...groupValueSet], 'ko') ?? []) {
      groupLabelMap.set(item.value, item.label)
    }

    const recipientMap = new Map<number, GETV1PointsDonationsMeRecipient[]>()
    for (const r of recipients) {
      const list = recipientMap.get(r.pointTransactionId) ?? []
      const label =
        r.recipientType === DONATION_RECIPIENT_TYPE.ARTIST
          ? (artistLabelMap.get(r.recipientValue) ?? r.recipientValue)
          : (groupLabelMap.get(r.recipientValue) ?? r.recipientValue)
      list.push({
        type: r.recipientType === DONATION_RECIPIENT_TYPE.ARTIST ? 'artist' : 'group',
        value: r.recipientValue,
        label,
        amount: r.amount,
      })
      recipientMap.set(r.pointTransactionId, list)
    }

    const items: GETV1PointsDonationsMeItem[] = donations.map((d) => ({
      id: d.id,
      totalAmount: -d.totalAmount,
      createdAt: d.createdAt.toISOString(),
      recipients: recipientMap.get(d.pointTransactionId) ?? [],
    }))

    return c.json<GETV1PointsDonationsMeResponse>(
      {
        items,
        nextCursor: hasMore ? (donations[donations.length - 1]?.id ?? null) : null,
      },
      { headers: { 'Cache-Control': privateCacheControl } },
    )
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '기부 내역을 불러오지 못했어요' })
  }
})

export default route
