import { zValidator } from '@hono/zod-validator'
import { and, eq, sql, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { EXPANSION_TYPE, ITEM_TYPE, POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { MAX_BOOKMARKS_PER_USER, MAX_LIBRARIES_PER_USER, MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import {
  pointTransactionTable,
  userExpansionTable,
  userItemTable,
  userPointsTable,
} from '@/database/supabase/points-schema'

const route = new Hono<Env>()

const spendSchema = z.object({
  type: z.enum(['library', 'history', 'bookmark', 'badge', 'theme']),
  itemId: z.string().optional(),
})

type SpendType = z.infer<typeof spendSchema>['type']

const errorResponses: Record<string, { error: string; status: 400 | 401 | 403 | 500 }> = {
  UNAUTHORIZED: { error: '로그인이 필요해요', status: 401 },
  INSUFFICIENT_POINTS: { error: '리보가 부족해요', status: 400 },
  MAX_EXPANSION_REACHED: { error: '최대 확장에 도달했어요', status: 400 },
  ITEM_ID_REQUIRED: { error: '아이템을 선택해 주세요', status: 400 },
  INVALID_BOOKMARK_PACK: { error: '잘못된 상품이에요', status: 400 },
  ITEM_ALREADY_OWNED: { error: '이미 보유한 아이템이에요', status: 400 },
}

route.post('/', zValidator('json', spendSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: errorResponses.UNAUTHORIZED.error }, errorResponses.UNAUTHORIZED.status)
  }

  const { type, itemId } = c.req.valid('json')
  const { price, description } = getSpendMeta({ type, itemId })

  try {
    const result = await db.transaction(async (tx) => {
      // 현재 포인트 확인
      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points || points.balance < price) {
        throw new Error('INSUFFICIENT_POINTS')
      }

      // 확장 타입인 경우 최대치 확인
      if (type === 'library' || type === 'history' || type === 'bookmark') {
        const { baseLimit, expansionAmount, expansionType, maxExpansion } = getExpansionConfig({ type, itemId })

        // 현재 확장량 조회 (타입별)
        const [expansion] = await tx
          .select({ totalAmount: sum(userExpansionTable.amount) })
          .from(userExpansionTable)
          .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, expansionType)))

        const currentTotal = baseLimit + Number(expansion?.totalAmount ?? 0)

        if (currentTotal + expansionAmount > maxExpansion) {
          throw new Error('MAX_EXPANSION_REACHED')
        }

        // 확장 레코드 추가
        await tx.insert(userExpansionTable).values({
          userId,
          type: expansionType,
          amount: expansionAmount,
        })
      }

      // 아이템 타입인 경우 아이템 추가
      if (type === 'badge' || type === 'theme') {
        if (!itemId) {
          throw new Error('ITEM_ID_REQUIRED')
        }

        const itemType = type === 'badge' ? ITEM_TYPE.BADGE : ITEM_TYPE.THEME

        // 이미 보유한 아이템인지 확인
        const [existingItem] = await tx
          .select({ id: userItemTable.id })
          .from(userItemTable)
          .where(eq(userItemTable.userId, userId))

        if (existingItem) {
          throw new Error('ITEM_ALREADY_OWNED')
        }

        // 아이템 추가
        await tx.insert(userItemTable).values({
          userId,
          type: itemType,
          itemId,
        })
      }

      // 포인트 차감
      const newBalance = points.balance - price
      await tx
        .update(userPointsTable)
        .set({
          balance: newBalance,
          totalSpent: sql`${userPointsTable.totalSpent} + ${price}`,
          updatedAt: new Date(),
        })
        .where(eq(userPointsTable.userId, userId))

      // 거래 내역 기록
      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.SHOP_PURCHASE,
        amount: -price,
        balanceAfter: newBalance,
        description,
      })

      return { balance: newBalance, spent: price }
    })

    return c.json({
      success: true,
      balance: result.balance,
      spent: result.spent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const response = errorResponses[message]

    if (response) {
      return c.json({ error: response.error }, response.status)
    }

    return c.json({ error: '포인트 사용에 실패했어요' }, 500)
  }
})

export default route

function getExpansionConfig({
  type,
  itemId,
}: {
  type: Extract<SpendType, 'bookmark' | 'history' | 'library'>
  itemId?: string
}): {
  expansionType: (typeof EXPANSION_TYPE)[keyof typeof EXPANSION_TYPE]
  baseLimit: number
  maxExpansion: number
  expansionAmount: number
} {
  if (type === 'library') {
    return {
      expansionType: EXPANSION_TYPE.LIBRARY,
      baseLimit: MAX_LIBRARIES_PER_USER,
      maxExpansion: POINT_CONSTANTS.LIBRARY_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT,
    }
  }
  if (type === 'history') {
    return {
      expansionType: EXPANSION_TYPE.READING_HISTORY,
      baseLimit: MAX_READING_HISTORY_PER_USER,
      maxExpansion: POINT_CONSTANTS.HISTORY_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT,
    }
  }

  if (!itemId) {
    throw new Error('ITEM_ID_REQUIRED')
  }

  if (itemId === 'small') {
    return {
      expansionType: EXPANSION_TYPE.BOOKMARK,
      baseLimit: MAX_BOOKMARKS_PER_USER,
      maxExpansion: POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT,
    }
  }
  if (itemId === 'large') {
    return {
      expansionType: EXPANSION_TYPE.BOOKMARK,
      baseLimit: MAX_BOOKMARKS_PER_USER,
      maxExpansion: POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
      expansionAmount: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT,
    }
  }

  throw new Error('INVALID_BOOKMARK_PACK')
}

function getSpendMeta({ type, itemId }: { type: SpendType; itemId?: string }): { price: number; description: string } {
  if (type === 'library') {
    return { price: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE, description: '내 서재 확장 (+1개)' }
  }
  if (type === 'history') {
    return { price: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE, description: '감상 기록 확장 (+100개)' }
  }
  if (type === 'bookmark') {
    if (!itemId) {
      throw new Error('ITEM_ID_REQUIRED')
    }
    if (itemId === 'small') {
      return {
        price: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_PRICE,
        description: `북마크 확장 (+${POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT}개)`,
      }
    }
    if (itemId === 'large') {
      return {
        price: POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_PRICE,
        description: `북마크 확장 (+${POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT}개)`,
      }
    }
    throw new Error('INVALID_BOOKMARK_PACK')
  }
  if (type === 'badge') {
    return { price: POINT_CONSTANTS.BADGE_PRICE, description: '프로필 뱃지 구매' }
  }

  return { price: POINT_CONSTANTS.THEME_PRICE, description: '커스텀 테마 구매' }
}
