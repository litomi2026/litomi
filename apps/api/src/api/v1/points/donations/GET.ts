import { translateArtistList } from '@litomi/catalog/translation/artist'
import { translateGroupList } from '@litomi/catalog/translation/group'
import {
  type GETV1PointsDonationRecipientResponse,
  type GETV1PointsDonationsMeItem,
  type GETV1PointsDonationsMeRecipient,
  type GETV1PointsDonationsMeResponse,
  getV1PointsDonationRecipientQuerySchema,
  getV1PointsDonationsMeQuerySchema,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import {
  DONATION_RECIPIENT_TYPE,
  pointDonationRecipientTable,
  pointDonationTable,
  pointTransactionTable,
} from '@litomi/db/app/points'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, desc, eq, inArray, lt, sum } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

const publicDailyCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('1 day'),
})

route.get('/recipient', zProblemValidator('query', getV1PointsDonationRecipientQuerySchema), async (c) => {
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

    const response = {
      totalReceived: Number(row?.total ?? 0),
    } satisfies GETV1PointsDonationRecipientResponse

    return c.json(response, { headers: { 'Cache-Control': publicDailyCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

const PER_PAGE = 20

route.get('/me', requireAuth, zProblemValidator('query', getV1PointsDonationsMeQuerySchema), async (c) => {
  const userId = c.get('userId')!
  const { cursor, locale } = c.req.valid('query')

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
    for (const item of translateArtistList([...artistValueSet], locale) ?? []) {
      artistLabelMap.set(item.value, item.label)
    }

    const groupLabelMap = new Map<string, string>()
    for (const item of translateGroupList([...groupValueSet], locale) ?? []) {
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

    const response = {
      items,
      nextCursor: hasMore ? (donations[donations.length - 1]?.id ?? null) : null,
    } satisfies GETV1PointsDonationsMeResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
