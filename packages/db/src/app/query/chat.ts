import { mergePaidIntervals, type PaidInterval } from '@litomi/domain/chat/policy'
import type { SettlementTaxType } from '@litomi/domain/payout/policy'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/domain/subscription/policy'
import { and, asc, desc, eq, gt, lte, sql } from 'drizzle-orm'
import { anyOf } from '../../sql'
import { db } from '../db'
import { chatArtistTable } from '../schema/chat'
import { invoiceTable } from '../schema/invoice'
import { subscriptionTable } from '../schema/subscription'
import { userTable } from '../schema/user'
import { type SubscriptionState, subscriptionStateColumns } from './subscription'

export type ChatArtistRow = typeof chatArtistTable.$inferSelect

export async function getChatArtistById(artistId: number): Promise<ChatArtistRow | undefined> {
  const [row] = await db.select().from(chatArtistTable).where(eq(chatArtistTable.id, artistId))
  return row
}

export async function getChatArtistByHandle(handle: string): Promise<ChatArtistRow | undefined> {
  const [row] = await db.select().from(chatArtistTable).where(eq(chatArtistTable.handle, handle))
  return row
}

export async function getChatArtistByUserId(userId: number): Promise<ChatArtistRow | undefined> {
  const [row] = await db.select().from(chatArtistTable).where(eq(chatArtistTable.userId, userId))
  return row
}

export async function listChatArtistsByIds(artistIds: number[]): Promise<Map<number, ChatArtistRow>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await db.select().from(chatArtistTable).where(anyOf(chatArtistTable.id, artistIds))

  return new Map(rows.map((row) => [row.id, row]))
}

export async function getChatSenderBrief(userId: number) {
  const [row] = await db
    .select({
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))

  return row
}

export interface ChatUserBriefRow {
  id: number
  nickname: string
  imageURL: string | null
}

export async function listUserBriefs(userIds: number[]): Promise<Map<number, ChatUserBriefRow>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      id: userTable.id,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(anyOf(userTable.id, userIds))

  return new Map(rows.map((row) => [row.id, row]))
}

export interface ChatArtistBriefRow {
  id: number
  handle: string
  displayName: string
  imageURL: string | null
  emoji: string | null
}

export interface ChatThreadArtistRow extends ChatArtistBriefRow {
  entitled: boolean
}

export interface ListChatThreadArtistsOptions {
  limit?: number
}

export async function listChatThreadArtists(
  userId: number,
  options: ListChatThreadArtistsOptions = {},
): Promise<ChatThreadArtistRow[]> {
  const { limit = 500 } = options
  const now = new Date()

  const paidNow = db
    .selectDistinct({ targetId: invoiceTable.targetId })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.userId, userId),
        eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(invoiceTable.status, 'paid'),
        lte(invoiceTable.periodStart, now),
        gt(invoiceTable.periodEnd, now),
      ),
    )
    .as('paid_now')

  const rows = await db
    .select({
      id: chatArtistTable.id,
      handle: chatArtistTable.handle,
      displayName: chatArtistTable.displayName,
      imageURL: chatArtistTable.imageURL,
      emoji: chatArtistTable.emoji,
      isActive: chatArtistTable.isActive,
      paidTargetId: paidNow.targetId,
    })
    .from(subscriptionTable)
    .innerJoin(chatArtistTable, eq(subscriptionTable.targetId, chatArtistTable.id))
    .leftJoin(paidNow, eq(paidNow.targetId, chatArtistTable.id))
    .where(and(eq(subscriptionTable.userId, userId), eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST)))
    .orderBy(asc(chatArtistTable.id))
    .limit(limit)

  return rows.map(({ isActive, paidTargetId, ...brief }) => ({
    ...brief,
    entitled: isActive && paidTargetId !== null,
  }))
}

export interface CreateChatArtistInput {
  userId: number
  handle: string
  displayName: string
  description: string | null
  emoji: string | null
  // null = 미오픈, 0 = 무료 개방, 그 외 = 유료.
  priceAmount: number | null
}

export async function createChatArtist(input: CreateChatArtistInput): Promise<ChatArtistRow> {
  const [row] = await db.insert(chatArtistTable).values(input).returning()
  return row
}

export interface ChatArtistPatch {
  handle?: string
  displayName?: string
  description?: string | null
  emoji?: string | null
  priceAmount?: number | null
  isActive?: boolean
}

export interface UpdateChatArtistInput {
  handle: string
  userId: number
  patch: ChatArtistPatch
}

export async function updateChatArtist({
  handle,
  userId,
  patch,
}: UpdateChatArtistInput): Promise<ChatArtistRow | undefined> {
  const [row] = await db
    .update(chatArtistTable)
    .set(patch)
    .where(and(eq(chatArtistTable.handle, handle), eq(chatArtistTable.userId, userId)))
    .returning()

  return row
}

export interface SetSettlementTaxProfileInput {
  taxType: SettlementTaxType
  // ISO 3166-1 alpha-2. non_resident가 아니면 무시하고 null로 정리한다(유형 밖 국가는 의미 없음).
  countryCode?: string | null
}

// 정산 세무 프로필 변경 — 아티스트 본인만(userId로 스코프). 원천징수 분기의 유일한 입력.
export async function setSettlementTaxProfile(
  userId: number,
  { taxType, countryCode }: SetSettlementTaxProfileInput,
): Promise<void> {
  await db
    .update(chatArtistTable)
    .set({
      settlementTaxType: taxType,
      settlementCountryCode: taxType === 'non_resident' ? (countryCode ?? null) : null,
    })
    .where(eq(chatArtistTable.userId, userId))
}

export interface ChatSubscriptionListRow {
  artist: ChatArtistBriefRow
  status: (typeof subscriptionTable.$inferSelect)['status']
  expiresAt: Date
  autoRenew: boolean
  priceAmount: number
  priceCurrency: string
}

export interface ListChatSubscriptionsOptions {
  limit?: number
}

export async function listChatSubscriptionsOfUser(
  userId: number,
  options: ListChatSubscriptionsOptions = {},
): Promise<ChatSubscriptionListRow[]> {
  const { limit = 100 } = options

  return db
    .select({
      artist: {
        id: chatArtistTable.id,
        handle: chatArtistTable.handle,
        displayName: chatArtistTable.displayName,
        imageURL: chatArtistTable.imageURL,
        emoji: chatArtistTable.emoji,
      },
      status: subscriptionTable.status,
      expiresAt: subscriptionTable.expiresAt,
      autoRenew: subscriptionTable.autoRenew,
      priceAmount: subscriptionTable.priceAmount,
      priceCurrency: subscriptionTable.priceCurrency,
    })
    .from(subscriptionTable)
    .innerJoin(chatArtistTable, eq(subscriptionTable.targetId, chatArtistTable.id))
    .where(and(eq(subscriptionTable.userId, userId), eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST)))
    .orderBy(desc(subscriptionTable.expiresAt))
    .limit(limit)
}

export async function stopChatSubscriptionRenewal(
  userId: number,
  handle: string,
): Promise<SubscriptionState | undefined> {
  const [row] = await db
    .update(subscriptionTable)
    .set({
      autoRenew: false,
      canceledAt: new Date(),
    })
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(
          subscriptionTable.targetId,
          db.select({ id: chatArtistTable.id }).from(chatArtistTable).where(eq(chatArtistTable.handle, handle)),
        ),
      ),
    )
    .returning(subscriptionStateColumns)

  return row
}

export interface FanArtistKey {
  userId: number
  artistId: number
}

export async function canAccessBroadcast({ userId, artistId }: FanArtistKey): Promise<boolean> {
  const [row] = await db
    .select({
      ownerUserId: chatArtistTable.userId,
      hasActiveSubscription: sql<boolean>`exists (
        select 1 from ${subscriptionTable}
        where ${subscriptionTable.userId} = ${userId}
          and ${subscriptionTable.targetType} = ${SUBSCRIPTION_TARGET_CHAT_ARTIST}
          and ${subscriptionTable.targetId} = ${artistId}
          and ${subscriptionTable.expiresAt} > now()
      )`,
    })
    .from(chatArtistTable)
    .where(eq(chatArtistTable.id, artistId))

  return row !== undefined && (row.ownerUserId === userId || row.hasActiveSubscription)
}

export async function listPaidIntervals({ userId, artistId }: FanArtistKey): Promise<PaidInterval[]> {
  const rows = await db
    .select({
      periodStart: invoiceTable.periodStart,
      periodEnd: invoiceTable.periodEnd,
    })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.userId, userId),
        eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(invoiceTable.targetId, artistId),
        eq(invoiceTable.status, 'paid'),
      ),
    )
    .orderBy(asc(invoiceTable.periodStart))

  return mergePaidIntervals(rows)
}

// listPaidIntervals의 배치 버전 — 한 팬의 여러 아티스트 열람권 구간을 한 번에 읽는다(채팅 목록에서
// 아티스트별 방송 프리뷰/안읽음을 결제 창으로 스코프하기 위함). 결제 이력이 없는 아티스트는
// Map에서 빠진다.
export async function listPaidIntervalsByArtist(
  userId: number,
  artistIds: number[],
): Promise<Map<number, PaidInterval[]>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      artistId: invoiceTable.targetId,
      periodStart: invoiceTable.periodStart,
      periodEnd: invoiceTable.periodEnd,
    })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.userId, userId),
        eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        anyOf(invoiceTable.targetId, artistIds),
        eq(invoiceTable.status, 'paid'),
      ),
    )
    // (targetId, periodStart) 오름차순 — 아티스트별 그룹이 곧바로 mergePaidIntervals 입력 순서가 된다.
    .orderBy(asc(invoiceTable.targetId), asc(invoiceTable.periodStart))

  const byArtist = new Map<number, { periodStart: Date; periodEnd: Date }[]>()

  for (const { artistId, periodStart, periodEnd } of rows) {
    const periods = byArtist.get(artistId)

    if (periods) {
      periods.push({ periodStart, periodEnd })
    } else {
      byArtist.set(artistId, [{ periodStart, periodEnd }])
    }
  }

  return new Map([...byArtist].map(([artistId, periods]) => [artistId, mergePaidIntervals(periods)]))
}

export const SUBSCRIBER_PAGE_SIZE = 1_000

export interface ListSubscribersOptions {
  afterUserId?: number
  limit?: number
}

export async function listActiveSubscriberUserIds(
  artistId: number,
  options: ListSubscribersOptions = {},
): Promise<number[]> {
  const { afterUserId = 0, limit = SUBSCRIBER_PAGE_SIZE } = options

  const rows = await db
    .select({ userId: subscriptionTable.userId })
    .from(subscriptionTable)
    .where(
      and(
        eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(subscriptionTable.targetId, artistId),
        gt(subscriptionTable.expiresAt, new Date()),
        gt(subscriptionTable.userId, afterUserId),
      ),
    )
    .orderBy(asc(subscriptionTable.userId))
    .limit(limit)

  return rows.map((row) => row.userId)
}
