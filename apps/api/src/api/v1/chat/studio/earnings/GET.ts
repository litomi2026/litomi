import { decryptSecret } from '@litomi/auth/secret-crypto'
import type { ChatPayoutDTO, GETV1ChatStudioEarningsResponse } from '@litomi/contracts'
import { getChatArtistByUserId } from '@litomi/db/app/query/chat'
import {
  computeSettlement,
  getPayoutAccount,
  getSettlementActivityOfArtist,
  listPayoutsOfArtist,
  monthWindowKST,
  type PayoutRow,
} from '@litomi/db/app/query/payout'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { noStoreCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

import { maskAccountNumber } from '../lib'

const route = new Hono<Env>()

// 아티스트 수익 대시보드 — 이번 달(KST) 실시간 집계 + 월 정산 내역 + 입금 계좌.
route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const artist = await getChatArtistByUserId(userId)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const window = monthWindowKST(new Date(), 0)

  const [activity, account, payouts] = await Promise.all([
    getSettlementActivityOfArtist(artist.id, window),
    getPayoutAccount(userId),
    listPayoutsOfArtist(artist.id),
  ])

  // 직전 정산이 이월이면 그 금액까지 반영한 이번 달 예상 지급액을 보여준다.
  // 정산 내역이 최신순이므로 첫 행이 곧 직전 정산이다.
  const latest = payouts[0]
  const carriedInAmount = latest?.status === 'carried' ? latest.payableAmount : 0
  const breakdown = computeSettlement(activity.grossAmount, activity.refundAmount, carriedInAmount)

  const response = {
    account: account && {
      bankName: account.bankName,
      accountNumberMasked: maskAccountNumber(decryptSecret(account.accountNumber)),
      holderName: account.holderName,
    },
    currentMonth: {
      grossAmount: activity.grossAmount,
      refundAmount: activity.refundAmount,
      estimatedPayableAmount: breakdown.payableAmount,
    },
    payouts: payouts.map(toPayoutDTO),
  } satisfies GETV1ChatStudioEarningsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

function toPayoutDTO(row: PayoutRow): ChatPayoutDTO {
  return {
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    grossAmount: row.grossAmount,
    refundAmount: row.refundAmount,
    feeAmount: row.feeAmount,
    withholdingAmount: row.withholdingAmount,
    carriedInAmount: row.carriedInAmount,
    payableAmount: row.payableAmount,
    currency: row.currency,
    status: row.status,
    paidAt: row.paidAt?.toISOString(),
  }
}

export default route
