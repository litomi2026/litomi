import { and, asc, eq, gt, inArray } from 'drizzle-orm'
import { db } from '../db'
import { chatCreatorTable, chatSubscriptionTable } from '../schema/chat'
import { userTable } from '../schema/user'

export async function getChatCreatorBrief(creatorId: number) {
  const [row] = await db
    .select({
      userId: chatCreatorTable.userId,
      displayName: chatCreatorTable.displayName,
      handle: chatCreatorTable.handle,
      emoji: chatCreatorTable.emoji,
    })
    .from(chatCreatorTable)
    .where(eq(chatCreatorTable.id, creatorId))

  return row ?? null
}

export async function getChatCreatorByHandle(handle: string) {
  const [row] = await db
    .select({
      id: chatCreatorTable.id,
      userId: chatCreatorTable.userId,
      isActive: chatCreatorTable.isActive,
      handle: chatCreatorTable.handle,
      displayName: chatCreatorTable.displayName,
      imageURL: chatCreatorTable.imageURL,
      emoji: chatCreatorTable.emoji,
    })
    .from(chatCreatorTable)
    .where(eq(chatCreatorTable.handle, handle))

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

export interface ChatCreatorBriefRow {
  id: number
  handle: string
  displayName: string
  imageURL: string | null
  emoji: string | null
}

export async function listEntitledSubscriptionsOfUser(userId: number, limit = 200): Promise<ChatCreatorBriefRow[]> {
  return db
    .select({
      id: chatCreatorTable.id,
      handle: chatCreatorTable.handle,
      displayName: chatCreatorTable.displayName,
      imageURL: chatCreatorTable.imageURL,
      emoji: chatCreatorTable.emoji,
    })
    .from(chatSubscriptionTable)
    .innerJoin(chatCreatorTable, eq(chatSubscriptionTable.creatorId, chatCreatorTable.id))
    .where(
      and(
        eq(chatSubscriptionTable.userId, userId),
        inArray(chatSubscriptionTable.status, ENTITLED_STATUSES),
        gt(chatSubscriptionTable.expiresAt, new Date()),
        eq(chatCreatorTable.isActive, true),
      ),
    )
    .orderBy(asc(chatCreatorTable.id))
    .limit(limit)
}

// Every creator a fan has EVER subscribed to (any status), for the chat list's
// "history" half: a lapsed fan keeps read access (perpetual 1:1 + paid-window
// broadcasts), so the creator must stay reachable even if they never sent a 1:1.
export async function listSubscribedCreatorIds(userId: number, limit = 500): Promise<number[]> {
  const rows = await db
    .selectDistinct({ creatorId: chatSubscriptionTable.creatorId })
    .from(chatSubscriptionTable)
    .where(eq(chatSubscriptionTable.userId, userId))
    .limit(limit)

  return rows.map((row) => row.creatorId)
}

// Briefs for creators a fan has past history with but is no longer entitled to.
// isActive is NOT filtered: a lapsed (or paused-creator) thread is still read-only
// viewable, so the list can render it.
export async function listChatCreatorBriefs(creatorIds: number[]): Promise<Map<number, ChatCreatorBriefRow>> {
  if (creatorIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      id: chatCreatorTable.id,
      handle: chatCreatorTable.handle,
      displayName: chatCreatorTable.displayName,
      imageURL: chatCreatorTable.imageURL,
      emoji: chatCreatorTable.emoji,
    })
    .from(chatCreatorTable)
    .where(inArray(chatCreatorTable.id, creatorIds))

  return new Map(rows.map((row) => [row.id, row]))
}

export async function getChatCreatorByUserId(userId: number) {
  const [row] = await db
    .select({ id: chatCreatorTable.id, isActive: chatCreatorTable.isActive })
    .from(chatCreatorTable)
    .where(eq(chatCreatorTable.userId, userId))

  return row ?? null
}

// "Entitled" = inside a paid period. The paid period is defined by time
// (expiresAt > now), not by status: cancelling only turns OFF auto-renew, so a
// cancelled subscription keeps access until expiresAt. Only 'expired' (or a future
// refunded/banned status) is excluded. This is the single source of truth for
// send + realtime + broadcast-read entitlement across the API and WS gateway.
const ENTITLED_STATUSES = ['active', 'cancelled'] as const

export async function hasActiveChatSubscription(userId: number, creatorId: number): Promise<boolean> {
  const [row] = await db
    .select({ userId: chatSubscriptionTable.userId })
    .from(chatSubscriptionTable)
    .where(
      and(
        eq(chatSubscriptionTable.creatorId, creatorId),
        eq(chatSubscriptionTable.userId, userId),
        inArray(chatSubscriptionTable.status, ENTITLED_STATUSES),
        gt(chatSubscriptionTable.expiresAt, new Date()),
      ),
    )

  return row !== undefined
}

export interface PaidInterval {
  startedAt: Date
  expiresAt: Date
}

// All paid windows for (fan, creator) as disjoint [startedAt, expiresAt) intervals,
// merged across rows. Every subscription row is a paid period (active/cancelled/expired
// all count; a future 'refunded' status would be excluded here). Backs interval-scoped
// broadcast read: a lapsed fan keeps the broadcasts sent while they were paying.
// Today this is usually one row (≈ a single window); it becomes gap-exact for free once
// renewals accrue as separate period rows (append-only) — no caller change needed.
export async function listPaidIntervals(userId: number, creatorId: number): Promise<PaidInterval[]> {
  const rows = await db
    .select({
      startedAt: chatSubscriptionTable.startedAt,
      expiresAt: chatSubscriptionTable.expiresAt,
    })
    .from(chatSubscriptionTable)
    .where(and(eq(chatSubscriptionTable.userId, userId), eq(chatSubscriptionTable.creatorId, creatorId)))
    .orderBy(asc(chatSubscriptionTable.startedAt))

  const merged: PaidInterval[] = []
  for (const row of rows) {
    const last = merged.at(-1)
    // Overlapping or adjacent window → extend; otherwise it's a new disjoint period.
    if (last && row.startedAt <= last.expiresAt) {
      if (row.expiresAt > last.expiresAt) {
        last.expiresAt = row.expiresAt
      }
    } else {
      merged.push({ startedAt: row.startedAt, expiresAt: row.expiresAt })
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
  creatorId: number,
  options: ListSubscribersOptions = {},
): Promise<number[]> {
  const limit = options.limit ?? SUBSCRIBER_PAGE_SIZE
  const afterUserId = options.afterUserId ?? 0

  const rows = await db
    .select({ userId: chatSubscriptionTable.userId })
    .from(chatSubscriptionTable)
    .where(
      and(
        eq(chatSubscriptionTable.creatorId, creatorId),
        inArray(chatSubscriptionTable.status, ENTITLED_STATUSES),
        gt(chatSubscriptionTable.expiresAt, new Date()),
        gt(chatSubscriptionTable.userId, afterUserId),
      ),
    )
    .orderBy(asc(chatSubscriptionTable.userId))
    .limit(limit)

  return rows.map((row) => row.userId)
}
