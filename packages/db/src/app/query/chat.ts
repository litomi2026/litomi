import { and, asc, eq, gt } from 'drizzle-orm'
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

// `userId` lets the caller decide broadcast (sender owns the creator) vs reply (subscribed fan).
export async function getChatCreatorByHandle(handle: string) {
  const [row] = await db
    .select({
      id: chatCreatorTable.id,
      userId: chatCreatorTable.userId,
      isActive: chatCreatorTable.isActive,
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

export async function getChatCreatorByUserId(userId: number) {
  const [row] = await db
    .select({ id: chatCreatorTable.id, isActive: chatCreatorTable.isActive })
    .from(chatCreatorTable)
    .where(eq(chatCreatorTable.userId, userId))

  return row ?? null
}

export async function hasActiveChatSubscription(userId: number, creatorId: number): Promise<boolean> {
  const [row] = await db
    .select({ userId: chatSubscriptionTable.userId })
    .from(chatSubscriptionTable)
    .where(
      and(
        eq(chatSubscriptionTable.creatorId, creatorId),
        eq(chatSubscriptionTable.userId, userId),
        eq(chatSubscriptionTable.status, 'active'),
        gt(chatSubscriptionTable.expiresAt, new Date()),
      ),
    )

  return row !== undefined
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
        eq(chatSubscriptionTable.status, 'active'),
        gt(chatSubscriptionTable.userId, afterUserId),
      ),
    )
    .orderBy(asc(chatSubscriptionTable.userId))
    .limit(limit)

  return rows.map((row) => row.userId)
}
