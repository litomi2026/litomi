import { type ChatArtistRow, listChatArtistsByIds } from '@litomi/db/app/query/chat'
import {
  createPayout,
  type LatestPayout,
  listLatestPayouts,
  type SettlementActivity,
  sumSettlementActivity,
} from '@litomi/db/app/query/payout'
import {
  computeSettlement,
  monthWindowKST,
  PAYOUT_MIN_AMOUNT,
  type SettlementWindow,
} from '@litomi/domain/payout/policy'

export interface SettleSummary {
  artists: number
  created: number
  pending: number
  carried: number
  skipped: number
}

// 전월(KST 달력월)을 마감해 아티스트별 payout 행을 만든다. 매일 도는 크론에서 실행되지만
// (아티스트, 월) unique 인덱스로 멱등이라 이미 마감된 달은 건너뛴다. 대상 = 그 달에
// 수납/환불 활동이 있는 아티스트 ∪ 직전 정산이 이월(carried)인 아티스트.
export async function closeMonthlyPayouts({ now = new Date() }: { now?: Date } = {}): Promise<SettleSummary> {
  const window = monthWindowKST(now, -1)
  const [activity, latestPayouts] = await Promise.all([sumSettlementActivity(window), listLatestPayouts()])

  const carriedArtistIds = [...latestPayouts]
    .filter(([, payout]) => payout.status === 'carried')
    .map(([artistId]) => artistId)

  const artistIds = new Set([...activity.keys(), ...carriedArtistIds])
  const artists = await listChatArtistsByIds([...artistIds])

  const summary: SettleSummary = {
    artists: artistIds.size,
    created: 0,
    pending: 0,
    carried: 0,
    skipped: 0,
  }

  for (const artistId of artistIds) {
    try {
      await settleArtist(
        artistId,
        window,
        activity.get(artistId),
        latestPayouts.get(artistId),
        artists.get(artistId),
        summary,
      )
    } catch (error) {
      console.error('billing-worker: settle artist failed', { artistId, error })
      summary.skipped++
    }
  }

  return summary
}

async function settleArtist(
  artistId: number,
  window: SettlementWindow,
  activity: SettlementActivity | undefined,
  latest: LatestPayout | undefined,
  artist: ChatArtistRow | undefined,
  summary: SettleSummary,
): Promise<void> {
  const grossAmount = activity?.grossAmount ?? 0
  const refundAmount = activity?.refundAmount ?? 0
  const feeAmount = activity?.feeAmount ?? 0
  const carriedInAmount = latest?.status === 'carried' ? latest.payableAmount : 0

  if (grossAmount === 0 && refundAmount === 0 && carriedInAmount === 0) {
    summary.skipped++
    return
  }

  // 아티스트가 탈퇴해도 페르소나 행은 tombstone(userId null)으로 남으므로 여기서 사라지지
  // 않는다 — 잔여 정산은 userId null로 기록만 남는다(지급 불가). 행 부재는 데이터 이상.
  if (!artist) {
    console.error('billing-worker: settle target artist missing', { artistId })
    summary.skipped++
    return
  }

  const breakdown = computeSettlement({
    grossAmount,
    refundAmount,
    feeAmount,
    carriedInAmount,
    taxType: artist.settlementTaxType,
  })

  const status = breakdown.payableAmount >= PAYOUT_MIN_AMOUNT ? 'pending' : 'carried'

  const created = await createPayout({
    chatArtistId: artistId,
    userId: artist.userId,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    grossAmount,
    refundAmount,
    feeAmount,
    withholdingAmount: breakdown.withholdingAmount,
    carriedInAmount,
    payableAmount: breakdown.payableAmount,
    currency: 'KRW',
    status,
  })

  if (!created) {
    summary.skipped++
    return
  }

  summary.created++
  summary[status]++
}
