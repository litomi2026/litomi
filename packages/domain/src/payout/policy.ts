// 플랫폼 수수료 상한(basis point). 아티스트 요율은 결코 이 값을 넘을 수 없다 — "모든 수수료 포함 20%".
export const PLATFORM_FEE_MAX_BPS = 2_000
// 파운딩 기본 요율(basis point, 1500 = 15%). 온보딩 시점에 아티스트에 동결되어(grandfathering),
// 이후 기본값을 올려도 기존 아티스트는 자신의 값을 유지한다.
export const DEFAULT_PLATFORM_FEE_BPS = 1_500
export const PAYOUT_MIN_AMOUNT = 10_000

// 정산 대상자의 세무 유형 — 원천징수 여부의 유일한 판별 축. 월 구독은 계속·반복이라 사업소득이며,
// individual(미등록 개인 거주자)만 3.3% 원천징수한다. business(사업자)는 세금계산서 발행이라, non_resident
// (비거주자)는 대개 국내원천이 아니라 현지 신고이므로 — 각각 한국 원천징수는 0. 비거주자의 국가는 별도 기록.
export const SETTLEMENT_TAX_TYPES = ['individual', 'business', 'non_resident'] as const
export type SettlementTaxType = (typeof SETTLEMENT_TAX_TYPES)[number]

// 개인 사업소득 원천징수 = 소득세 3% + 지방소득세(소득세액의 10% = 실효 0.3%). 각 단계 원단위 절사.
export const WITHHOLDING_INCOME_TAX_RATE = 0.03
export const WITHHOLDING_LOCAL_TAX_RATE = 0.1

// individual만 원천징수한다 — 소득세를 원단위 절사한 뒤 지방소득세를 그 10%로 다시 절사(이중 절사, 국세청 방식).
export function computeWithholding(base: number, taxType: SettlementTaxType): number {
  if (taxType !== 'individual' || base <= 0) {
    return 0
  }

  const incomeTax = Math.trunc(base * WITHHOLDING_INCOME_TAX_RATE)
  const localTax = Math.trunc(incomeTax * WITHHOLDING_LOCAL_TAX_RATE)
  return incomeTax + localTax
}

// 아티스트 요율을 [0, 상한]으로 클램프 — 온보딩·프로모로 세팅되는 모든 요율의 단일 검증점.
export function clampFeeBps(feeBps: number): number {
  if (!Number.isFinite(feeBps)) {
    return DEFAULT_PLATFORM_FEE_BPS
  }

  return Math.min(Math.max(Math.trunc(feeBps), 0), PLATFORM_FEE_MAX_BPS)
}

// 청구 금액에 요율(bps)을 적용한 수수료액 — 원 단위 trunc. 청구 시점에 원장(payment)에 스냅샷된다.
export function computeFeeAmount(amount: number, feeBps: number): number {
  return Math.trunc((amount * clampFeeBps(feeBps)) / 10_000)
}

export interface SettlementBreakdown {
  withholdingAmount: number
  payableAmount: number
}

export interface SettlementInput {
  grossAmount: number
  refundAmount: number
  // 각 결제의 청구 시점 요율로 이미 산정된 net 수수료(수납분 − 환불 역산분). 원장 합계라 상수와 무관하다.
  feeAmount: number
  carriedInAmount: number
  // 정산 대상 아티스트의 세무 유형 — business면 원천징수 0.
  taxType: SettlementTaxType
}

// 정산 산식(현금주의): (수납 − 환불 − 스냅샷 수수료) → individual만 원천징수(양수 달) → ±이월.
// 원 단위 trunc — 환불이 수납을 초과한 음수 달에도 대칭으로 동작한다(원천징수만 역산하지 않음).
export function computeSettlement({
  grossAmount,
  refundAmount,
  feeAmount,
  carriedInAmount,
  taxType,
}: SettlementInput): SettlementBreakdown {
  const afterFee = grossAmount - refundAmount - feeAmount
  const withholdingAmount = computeWithholding(afterFee, taxType)

  return {
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
