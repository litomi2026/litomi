import type { BillingGateway } from '@litomi/billing'
import { listStalePendingPayments, markPaymentFailed } from '@litomi/db/app/query/payment'
import { confirmPayment } from '@litomi/db/app/query/subscription'

// charge 성공과 confirmPayment 사이에 프로세스가 죽고 웹훅까지 유실되면 결제가 pending에
// 갇힌다. 이 패스는 오래된 pending을 PG의 실제 상태로 수렴시킨다(웹훅의 마지막 안전망).
// 15분: 정상 경로(수 초)와 지연 웹훅이 끝나고도 남을 시간.
const STALE_AFTER_MS = 15 * 60_000
const PAGE_SIZE = 200

export interface ReconcileSummary {
  scanned: number
  confirmed: number
  failed: number
  skipped: number
}

export async function reconcileStalePendingPayments(options: {
  gateway: BillingGateway
  now?: Date
}): Promise<ReconcileSummary> {
  const { gateway, now = new Date() } = options
  const summary: ReconcileSummary = { scanned: 0, confirmed: 0, failed: 0, skipped: 0 }
  const olderThan = new Date(now.getTime() - STALE_AFTER_MS)
  let afterId = 0

  while (true) {
    const rows = await listStalePendingPayments({ olderThan, afterId, limit: PAGE_SIZE })

    if (rows.length === 0) {
      break
    }

    for (const row of rows) {
      afterId = row.id
      summary.scanned++
      await reconcileOne(row.paymentId, gateway, now, summary)
    }

    if (rows.length < PAGE_SIZE) {
      break
    }
  }

  return summary
}

async function reconcileOne(
  paymentId: string,
  gateway: BillingGateway,
  now: Date,
  summary: ReconcileSummary,
): Promise<void> {
  let remote: Awaited<ReturnType<BillingGateway['getPayment']>>
  try {
    remote = await gateway.getPayment(paymentId)
  } catch (error) {
    // PG 미등록(charge가 PG에 닿기 전 죽음) 또는 일시 장애 — 다음 실행에서 재시도한다.
    console.error('billing-worker: reconcile getPayment failed', { paymentId, error })
    summary.skipped++
    return
  }

  if (remote.status === 'paid') {
    await confirmPayment(paymentId, {
      providerTxnId: remote.providerTxnId ?? paymentId,
      paidAt: remote.paidAt ?? now,
      paymentMethodId: null,
      method: remote.method,
    })

    summary.confirmed++
    return
  }

  if (remote.status === 'failed' || remote.status === 'canceled') {
    await markPaymentFailed(paymentId, { code: 'stale_reconcile', message: `PG status: ${remote.status}` })
    summary.failed++
    return
  }

  summary.skipped++
}
