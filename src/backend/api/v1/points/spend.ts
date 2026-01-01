import { and, eq, sql, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { ITEM_TYPE, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { pointTransactionTable, userExpansionTable, userItemTable, userPointsTable } from '@/database/supabase/points'

import { getExpansionConfig, getSpendMeta, isBookmarkItemId } from './util'

const route = new Hono<Env>()

const spendSchema = z.object({
  type: z.enum(['library', 'history', 'rating', 'bookmark', 'badge', 'theme']),
  itemId: z.string().optional(),
})

export type POSTV1PointSpendRequest = z.infer<typeof spendSchema>

export type POSTV1PointSpendResponse = {
  balance: number
  spent: number
}

route.post('/', zProblemValidator('json', spendSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  type TransactionResult = { ok: false; status: number; detail?: string } | { ok: true; balance: number; spent: number }

  try {
    const { type, itemId } = c.req.valid('json')
    let spendMeta
    let expansionConfig: ReturnType<typeof getExpansionConfig> | null = null
    let purchaseItem: { type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE]; itemId: string } | null = null

    switch (type) {
      case 'badge':
      case 'theme': {
        const selectedItemId = itemId?.trim()
        if (!selectedItemId) {
          return problemResponse(c, { status: 400, detail: '아이템을 선택해 주세요' })
        }

        spendMeta = getSpendMeta({ type })
        purchaseItem = {
          type: type === 'badge' ? ITEM_TYPE.BADGE : ITEM_TYPE.THEME,
          itemId: selectedItemId,
        }
        break
      }
      case 'bookmark': {
        if (!isBookmarkItemId(itemId)) {
          return problemResponse(c, {
            status: 400,
            detail: itemId ? '잘못된 상품이에요' : '아이템을 선택해 주세요',
          })
        }

        spendMeta = getSpendMeta({ type, itemId })
        expansionConfig = getExpansionConfig({ type, itemId })
        break
      }
      case 'history': {
        spendMeta = getSpendMeta({ type })
        expansionConfig = getExpansionConfig({ type })
        break
      }
      case 'library': {
        spendMeta = getSpendMeta({ type })
        expansionConfig = getExpansionConfig({ type })
        break
      }
      case 'rating': {
        spendMeta = getSpendMeta({ type })
        expansionConfig = getExpansionConfig({ type })
        break
      }
      default: {
        return problemResponse(c, { status: 400, detail: '잘못된 요청이에요' })
      }
    }

    const result: TransactionResult = await db.transaction(async (tx) => {
      // 현재 포인트 확인
      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points || points.balance < spendMeta.price) {
        return { ok: false, status: 400, detail: '리보가 부족해요' }
      }

      // 확장 타입인 경우 최대치 확인
      if (expansionConfig) {
        const { baseLimit, expansionAmount, expansionType, maxExpansion } = expansionConfig

        // 현재 확장량 조회 (타입별)
        const [expansion] = await tx
          .select({ totalAmount: sum(userExpansionTable.amount) })
          .from(userExpansionTable)
          .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, expansionType)))

        const currentTotal = baseLimit + Number(expansion?.totalAmount ?? 0)

        if (currentTotal + expansionAmount > maxExpansion) {
          return { ok: false, status: 400, detail: '최대 확장에 도달했어요' }
        }

        // 확장 레코드 추가
        await tx.insert(userExpansionTable).values({
          userId,
          type: expansionType,
          amount: expansionAmount,
        })
      }

      // 아이템 타입인 경우 아이템 추가
      if (purchaseItem) {
        // 이미 보유한 아이템인지 확인
        const [existingItem] = await tx
          .select({ id: userItemTable.id })
          .from(userItemTable)
          .where(eq(userItemTable.userId, userId))

        if (existingItem) {
          return { ok: false, status: 400, detail: '이미 보유한 아이템이에요' }
        }

        // 아이템 추가
        await tx.insert(userItemTable).values({
          userId,
          type: purchaseItem.type,
          itemId: purchaseItem.itemId,
        })
      }

      // 포인트 차감
      const newBalance = points.balance - spendMeta.price
      await tx
        .update(userPointsTable)
        .set({
          balance: newBalance,
          totalSpent: sql`${userPointsTable.totalSpent} + ${spendMeta.price}`,
          updatedAt: new Date(),
        })
        .where(eq(userPointsTable.userId, userId))

      // 거래 내역 기록
      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.SHOP_PURCHASE,
        amount: -spendMeta.price,
        balanceAfter: newBalance,
        description: spendMeta.description,
      })

      return { ok: true, balance: newBalance, spent: spendMeta.price }
    })

    if (!result.ok) {
      return problemResponse(c, { status: result.status, detail: result.detail })
    }

    return c.json<POSTV1PointSpendResponse>({
      balance: result.balance,
      spent: result.spent,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '포인트 사용에 실패했어요' })
  }
})

export default route
