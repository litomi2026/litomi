import { zValidator } from '@hono/zod-validator'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { EXPANSION_TYPE, ITEM_TYPE, POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import {
  pointTransactionTable,
  userExpansionTable,
  userItemTable,
  userPointsTable,
} from '@/database/supabase/points-schema'

const route = new Hono<Env>()

const spendSchema = z.object({
  type: z.enum(['library', 'history', 'badge', 'theme']),
  itemId: z.string().optional(),
})

type SpendType = z.infer<typeof spendSchema>['type']

const PRICES: Record<SpendType, number> = {
  library: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE,
  history: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE,
  badge: POINT_CONSTANTS.BADGE_PRICE,
  theme: POINT_CONSTANTS.THEME_PRICE,
}

const DESCRIPTIONS: Record<SpendType, string> = {
  library: '내서재 확장 (+1개)',
  history: '감상 기록 확장 (+100개)',
  badge: '프로필 뱃지 구매',
  theme: '커스텀 테마 구매',
}

route.post('/', zValidator('json', spendSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { type, itemId } = c.req.valid('json')
  const price = PRICES[type]

  try {
    const result = await db.transaction(async (tx) => {
      // 현재 포인트 확인
      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points || points.balance < price) {
        throw new Error('Insufficient points')
      }

      // 확장 타입인 경우 최대치 확인
      if (type === 'library' || type === 'history') {
        const expansionType = type === 'library' ? EXPANSION_TYPE.LIBRARY : EXPANSION_TYPE.READING_HISTORY
        const maxExpansion =
          type === 'library' ? POINT_CONSTANTS.LIBRARY_MAX_EXPANSION : POINT_CONSTANTS.HISTORY_MAX_EXPANSION
        const baseLimit = type === 'library' ? 5 : 500
        const expansionAmount =
          type === 'library' ? POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT : POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT

        // 현재 확장량 조회
        const expansions = await tx
          .select({ amount: userExpansionTable.amount })
          .from(userExpansionTable)
          .where(eq(userExpansionTable.userId, userId))

        const currentTotal = expansions.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, baseLimit)

        if (currentTotal + expansionAmount > maxExpansion) {
          throw new Error('Maximum expansion reached')
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
          throw new Error('Item ID required')
        }

        const itemType = type === 'badge' ? ITEM_TYPE.BADGE : ITEM_TYPE.THEME

        // 이미 보유한 아이템인지 확인
        const [existingItem] = await tx
          .select({ id: userItemTable.id })
          .from(userItemTable)
          .where(eq(userItemTable.userId, userId))

        if (existingItem) {
          throw new Error('Item already owned')
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
        description: DESCRIPTIONS[type],
      })

      return { balance: newBalance, spent: price }
    })

    return c.json({
      success: true,
      balance: result.balance,
      spent: result.spent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '포인트 사용에 실패했어요'

    if (message === 'Insufficient points') {
      return c.json({ error: '리보가 부족해요' }, 400)
    }
    if (message === 'Maximum expansion reached') {
      return c.json({ error: '최대 확장에 도달했어요' }, 400)
    }
    if (message === 'Item already owned') {
      return c.json({ error: '이미 보유한 아이템이에요' }, 400)
    }

    return c.json({ error: message }, 500)
  }
})

export default route
