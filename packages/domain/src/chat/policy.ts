import ms from 'ms'

export interface PaidInterval {
  startedAt: Date
  expiresAt: Date
}

// 결제된 invoice 기간(periodStart 오름차순)을 겹치거나 맞닿은 것끼리 병합한다 — 열람권 판정의
// 정본. 현재 시각을 덮는 구간이 있으면 entitled, 과거 구간만 있으면 lapsed.
export function mergePaidIntervals(periods: { periodStart: Date; periodEnd: Date }[]): PaidInterval[] {
  const merged: PaidInterval[] = []

  for (const period of periods) {
    const last = merged.at(-1)

    if (last && period.periodStart <= last.expiresAt) {
      if (period.periodEnd > last.expiresAt) {
        last.expiresAt = period.periodEnd
      }
    } else {
      merged.push({ startedAt: period.periodStart, expiresAt: period.periodEnd })
    }
  }

  return merged
}

// 팬 답장 정책 — 횟수는 메시지당 고정, 길이만 가변: 기본 30자에서 연속 구독 30일을 채울 때마다
// +30자, 300자에서 상한. "연속"의 근거는 끊김 없이 이어진 유료 기간(병합된 paid invoice
// 구간)이므로, 구독이 끊겼다 재개되면 길이 보너스는 처음부터 다시 쌓입니다.
export const REPLY_MAX_PER_MESSAGE = 3

const REPLY_BASE_TEXT_LENGTH = 30
const REPLY_BONUS_MAX = 9
const REPLY_BONUS_UNIT_MS = ms('30 days')

// 현재 시각을 덮는 유료 구간이 없으면(=답장 자격 없음) undefined를 반환합니다.
export function resolveReplyTextLimit(intervals: PaidInterval[], now: Date): number | undefined {
  const current = intervals.find((interval) => interval.startedAt <= now && now < interval.expiresAt)

  if (!current) {
    return undefined
  }

  const bonus = Math.min(
    REPLY_BONUS_MAX,
    Math.floor((now.getTime() - current.startedAt.getTime()) / REPLY_BONUS_UNIT_MS),
  )

  return REPLY_BASE_TEXT_LENGTH * (1 + bonus)
}
