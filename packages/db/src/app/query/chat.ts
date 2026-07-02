import { and, asc, eq, gt, inArray } from 'drizzle-orm'
import { db } from '../db'
import { chatArtistTable } from '../schema/chat'
import { invoiceTable } from '../schema/invoice'
import { subscriptionTable } from '../schema/subscription'
import { userTable } from '../schema/user'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from './subscription'

export async function getChatArtistBrief(artistId: number) {
  const [row] = await db
    .select({
      userId: chatArtistTable.userId,
      displayName: chatArtistTable.displayName,
      handle: chatArtistTable.handle,
      emoji: chatArtistTable.emoji,
    })
    .from(chatArtistTable)
    .where(eq(chatArtistTable.id, artistId))

  return row ?? null
}

export async function getChatArtistByHandle(handle: string) {
  const [row] = await db
    .select({
      id: chatArtistTable.id,
      userId: chatArtistTable.userId,
      isActive: chatArtistTable.isActive,
      handle: chatArtistTable.handle,
      displayName: chatArtistTable.displayName,
      description: chatArtistTable.description,
      imageURL: chatArtistTable.imageURL,
      emoji: chatArtistTable.emoji,
      priceAmount: chatArtistTable.priceAmount,
      priceCurrency: chatArtistTable.priceCurrency,
    })
    .from(chatArtistTable)
    .where(eq(chatArtistTable.handle, handle))

  return row ?? null
}

export async function getChatArtistById(artistId: number) {
  const [row] = await db
    .select({
      id: chatArtistTable.id,
      displayName: chatArtistTable.displayName,
      isActive: chatArtistTable.isActive,
      priceAmount: chatArtistTable.priceAmount,
      priceCurrency: chatArtistTable.priceCurrency,
    })
    .from(chatArtistTable)
    .where(eq(chatArtistTable.id, artistId))

  return row ?? null
}

export async function getChatSenderBrief(userId: number) {
  const [row] = await db
    .select({
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))

  return row ?? null
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
    .where(inArray(userTable.id, userIds))

  return new Map(rows.map((row) => [row.id, row]))
}

export interface ChatArtistBriefRow {
  id: number
  handle: string
  displayName: string
  imageURL: string | null
  emoji: string | null
}

export async function listEntitledSubscriptionsOfUser(userId: number, limit = 200): Promise<ChatArtistBriefRow[]> {
  return db
    .select({
      id: chatArtistTable.id,
      handle: chatArtistTable.handle,
      displayName: chatArtistTable.displayName,
      imageURL: chatArtistTable.imageURL,
      emoji: chatArtistTable.emoji,
    })
    .from(subscriptionTable)
    .innerJoin(chatArtistTable, eq(subscriptionTable.targetId, chatArtistTable.id))
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        gt(subscriptionTable.expiresAt, new Date()),
        eq(chatArtistTable.isActive, true),
      ),
    )
    .orderBy(asc(chatArtistTable.id))
    .limit(limit)
}
export async function listSubscribedArtistIds(userId: number, limit = 500): Promise<number[]> {
  const rows = await db
    .selectDistinct({ targetId: subscriptionTable.targetId })
    .from(subscriptionTable)
    .where(and(eq(subscriptionTable.userId, userId), eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST)))
    .limit(limit)

  return rows.map((row) => row.targetId)
}

// Briefs for artists a fan has past history with but is no longer entitled to. isActive is
// NOT filtered: a lapsed (or paused-artist) thread is still read-only viewable.
export async function listChatArtistBriefs(artistIds: number[]): Promise<Map<number, ChatArtistBriefRow>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      id: chatArtistTable.id,
      handle: chatArtistTable.handle,
      displayName: chatArtistTable.displayName,
      imageURL: chatArtistTable.imageURL,
      emoji: chatArtistTable.emoji,
    })
    .from(chatArtistTable)
    .where(inArray(chatArtistTable.id, artistIds))

  return new Map(rows.map((row) => [row.id, row]))
}

export async function getChatArtistByUserId(userId: number) {
  const [row] = await db
    .select({ id: chatArtistTable.id, isActive: chatArtistTable.isActive })
    .from(chatArtistTable)
    .where(eq(chatArtistTable.userId, userId))

  return row ?? null
}

export async function hasActiveChatSubscription(userId: number, artistId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: subscriptionTable.id })
    .from(subscriptionTable)
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(subscriptionTable.targetId, artistId),
        gt(subscriptionTable.expiresAt, new Date()),
      ),
    )

  return row !== undefined
}

export interface PaidInterval {
  startedAt: Date
  expiresAt: Date
}

export async function listPaidIntervals(userId: number, artistId: number): Promise<PaidInterval[]> {
  const rows = await db
    .select({
      periodStart: invoiceTable.periodStart,
      periodEnd: invoiceTable.periodEnd,
    })
    .from(invoiceTable)
    .innerJoin(subscriptionTable, eq(subscriptionTable.id, invoiceTable.subscriptionId))
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
        eq(subscriptionTable.targetId, artistId),
        eq(invoiceTable.status, 'paid'),
      ),
    )
    .orderBy(asc(invoiceTable.periodStart))

  const merged: PaidInterval[] = []

  for (const row of rows) {
    const last = merged.at(-1)

    if (last && row.periodStart <= last.expiresAt) {
      if (row.periodEnd > last.expiresAt) {
        last.expiresAt = row.periodEnd
      }
    } else {
      merged.push({ startedAt: row.periodStart, expiresAt: row.periodEnd })
    }
  }

  return merged
}

export const SUBSCRIBER_PAGE_SIZE = 1_000

interface ListSubscribersOptions {
  afterUserId?: number
  limit?: number
}

export async function listActiveSubscriberUserIds(
  artistId: number,
  options: ListSubscribersOptions = {},
): Promise<number[]> {
  const limit = options.limit ?? SUBSCRIBER_PAGE_SIZE
  const afterUserId = options.afterUserId ?? 0

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
