export const PAYOUT_FEE_RATE = 0.25
export const PAYOUT_WITHHOLDING_RATE = 0.033
export const PAYOUT_MIN_AMOUNT = 10_000

export interface SettlementBreakdown {
  feeAmount: number
  withholdingAmount: number
  payableAmount: number
}

export interface SettlementInput {
  grossAmount: number
  refundAmount: number
  carriedInAmount: number
}

// 정산 산식(현금주의): (수납 − 환불) → 수수료 25% → 양수일 때만 원천징수 3.3%(사업소득) → ±이월.
// 원 단위 trunc — 환불이 수납을 초과한 음수 달에도 대칭으로 동작한다(원천징수만 역산하지 않음).
export function computeSettlement({
  grossAmount,
  refundAmount,
  carriedInAmount,
}: SettlementInput): SettlementBreakdown {
  const settledBase = grossAmount - refundAmount
  const feeAmount = Math.trunc(settledBase * PAYOUT_FEE_RATE)
  const afterFee = settledBase - feeAmount
  const withholdingAmount = afterFee > 0 ? Math.trunc(afterFee * PAYOUT_WITHHOLDING_RATE) : 0

  return {
    feeAmount,
    withholdingAmount,
    payableAmount: afterFee - withholdingAmount + carriedInAmount,
  }
}

export interface SettlementWindow {
  periodStart: Date
  periodEnd: Date
}

const KST_OFFSET_MS = 9 * 3_600_000

// 정산 월 경계는 KST 달력월 — 반환값은 그 경계의 UTC 인스턴트. monthOffset 0 = 이번 달, -1 = 전월.
export function monthWindowKST(now: Date, monthOffset: number): SettlementWindow {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  const year = kst.getUTCFullYear()
  const month = kst.getUTCMonth() + monthOffset

  return {
    periodStart: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS),
    periodEnd: new Date(Date.UTC(year, month + 1, 1) - KST_OFFSET_MS),
  }
}
