import {
  getV1PointTransactionQuerySchema,
  type GETV1PointTransactionResponse,
  type Transaction,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { pointTransactionTable } from '@litomi/db/app/points'
import { Locale, LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@litomi/domain/points/model'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

const PER_PAGE = 20

route.get('/', requireAuth, requireAdult, zProblemValidator('query', getV1PointTransactionQuerySchema), async (c) => {
  const userId = c.get('userId')!
  const { cursor, locale } = c.req.valid('query')

  const whereConditions = cursor
    ? and(eq(pointTransactionTable.userId, userId), lt(pointTransactionTable.id, cursor))
    : eq(pointTransactionTable.userId, userId)

  try {
    const transactions = await db
      .select({
        id: pointTransactionTable.id,
        type: pointTransactionTable.type,
        amount: pointTransactionTable.amount,
        balanceAfter: pointTransactionTable.balanceAfter,
        createdAt: pointTransactionTable.createdAt,
      })
      .from(pointTransactionTable)
      .where(whereConditions)
      .orderBy(desc(pointTransactionTable.id))
      .limit(PER_PAGE + 1)

    const hasMore = transactions.length > PER_PAGE

    if (hasMore) {
      transactions.pop()
    }

    const items: Transaction[] = transactions.map((t) => ({
      id: t.id,
      type: t.amount > 0 ? 'earn' : 'spend',
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: getTransactionDescription({ amount: t.amount, locale, transactionType: t.type }),
      createdAt: t.createdAt.toISOString(),
    }))

    const response = {
      items,
      nextCursor: hasMore ? transactions[transactions.length - 1].id : null,
    }
    return c.json<GETV1PointTransactionResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '거래 내역을 불러오지 못했어요' })
  }
})

export default route

type ExpansionKind = 'bookmark' | 'history' | 'library' | 'rating'

type TransactionDescriptionParams = {
  transactionType: number
  amount: number
  locale: Locale
}

type TransactionLabelKey =
  | 'adClick'
  | 'adminGrant'
  | 'badgePurchase'
  | 'donation'
  | 'pointUnit'
  | 'rouletteBet'
  | 'roulettePayout'
  | 'themePurchase'

function getTransactionDescription({ transactionType, amount, locale }: TransactionDescriptionParams): string | null {
  const labels = TRANSACTION_LABELS[locale]
  const amountLabel = amount.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])
  const absoluteAmountLabel = Math.abs(amount).toLocaleString(LOCALE_LANGUAGE_TAGS[locale])

  switch (transactionType) {
    case TRANSACTION_TYPE.AD_CLICK:
      return labels.adClick
    case TRANSACTION_TYPE.ADMIN_GRANT:
      return `${labels.adminGrant} (+${amountLabel} ${labels.pointUnit})`
    case TRANSACTION_TYPE.BADGE_PURCHASE:
      return labels.badgePurchase
    case TRANSACTION_TYPE.BOOKMARK_EXPANSION_LARGE:
      return getExpansionLabel(locale, 'bookmark', POINT_CONSTANTS.BOOKMARK_EXPANSION_LARGE_AMOUNT)
    case TRANSACTION_TYPE.BOOKMARK_EXPANSION_SMALL:
      return getExpansionLabel(locale, 'bookmark', POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT)
    case TRANSACTION_TYPE.DONATION:
      return labels.donation
    case TRANSACTION_TYPE.HISTORY_EXPANSION:
      return getExpansionLabel(locale, 'history', POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT)
    case TRANSACTION_TYPE.LIBRARY_EXPANSION:
      return getExpansionLabel(locale, 'library', POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT)
    case TRANSACTION_TYPE.RATING_EXPANSION:
      return getExpansionLabel(locale, 'rating', POINT_CONSTANTS.RATING_EXPANSION_AMOUNT)
    case TRANSACTION_TYPE.ROULETTE_BET:
      return `${labels.rouletteBet} (-${absoluteAmountLabel} ${labels.pointUnit})`
    case TRANSACTION_TYPE.ROULETTE_PAYOUT:
      return `${labels.roulettePayout} (+${amountLabel} ${labels.pointUnit})`
    case TRANSACTION_TYPE.THEME_PURCHASE:
      return labels.themePurchase
    default:
      return null
  }
}

const TRANSACTION_LABELS = {
  [Locale.KO]: {
    adClick: '광고 클릭',
    adminGrant: '운영 지급',
    badgePurchase: '프로필 뱃지 구매',
    donation: '후원',
    pointUnit: '리보',
    rouletteBet: '룰렛 배팅',
    roulettePayout: '룰렛 당첨',
    themePurchase: '커스텀 테마 구매',
  },
  [Locale.EN]: {
    adClick: 'Ad click',
    adminGrant: 'Admin grant',
    badgePurchase: 'Profile badge purchase',
    donation: 'Donation',
    pointUnit: 'Libo',
    rouletteBet: 'Roulette bet',
    roulettePayout: 'Roulette payout',
    themePurchase: 'Custom theme purchase',
  },
  [Locale.JA]: {
    adClick: 'Ad click',
    adminGrant: 'Admin grant',
    badgePurchase: 'Profile badge purchase',
    donation: 'Donation',
    pointUnit: 'Libo',
    rouletteBet: 'Roulette bet',
    roulettePayout: 'Roulette payout',
    themePurchase: 'Custom theme purchase',
  },
  [Locale.ZH_CN]: {
    adClick: 'Ad click',
    adminGrant: 'Admin grant',
    badgePurchase: 'Profile badge purchase',
    donation: 'Donation',
    pointUnit: 'Libo',
    rouletteBet: 'Roulette bet',
    roulettePayout: 'Roulette payout',
    themePurchase: 'Custom theme purchase',
  },
  [Locale.ZH_TW]: {
    adClick: 'Ad click',
    adminGrant: 'Admin grant',
    badgePurchase: 'Profile badge purchase',
    donation: 'Donation',
    pointUnit: 'Libo',
    rouletteBet: 'Roulette bet',
    roulettePayout: 'Roulette payout',
    themePurchase: 'Custom theme purchase',
  },
} satisfies Record<Locale, Record<TransactionLabelKey, string>>

const EXPANSION_LABELS = {
  [Locale.KO]: {
    bookmark: '북마크 확장',
    history: '감상 기록 확장',
    library: '내 서재 확장',
    rating: '평가 확장',
  },
  [Locale.EN]: {
    bookmark: 'Bookmark expansion',
    history: 'History expansion',
    library: 'Library expansion',
    rating: 'Rating expansion',
  },
  [Locale.JA]: {
    bookmark: 'Bookmark expansion',
    history: 'History expansion',
    library: 'Library expansion',
    rating: 'Rating expansion',
  },
  [Locale.ZH_CN]: {
    bookmark: 'Bookmark expansion',
    history: 'History expansion',
    library: 'Library expansion',
    rating: 'Rating expansion',
  },
  [Locale.ZH_TW]: {
    bookmark: 'Bookmark expansion',
    history: 'History expansion',
    library: 'Library expansion',
    rating: 'Rating expansion',
  },
} satisfies Record<Locale, Record<ExpansionKind, string>>

function getExpansionLabel(locale: Locale, kind: ExpansionKind, amount: number): string {
  const label = EXPANSION_LABELS[locale][kind]
  return locale === Locale.KO ? `${label} (+${amount}개)` : `${label} (+${amount})`
}
