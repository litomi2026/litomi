import { createClientSeed } from './generator'
import type { FortuneTaste } from './types'

const USER_KEY = 'litomi.sexFortune.userId'
const DAILY_KEY = 'litomi.sexFortune.daily'
const STREAK_KEY = 'litomi.sexFortune.streak'

export const MAX_REROLLS_PER_DAY = 5

export type FortuneDailyState = {
  dateKey: string
  taste: FortuneTaste | null
  nonce: number
  revealed: boolean
}

export type FortuneStreak = {
  lastDateKey: string | null
  count: number
  best: number
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getUserKey(): string {
  const existing = window.localStorage.getItem(USER_KEY)
  if (existing) {
    return existing
  }

  const created = createClientSeed()
  window.localStorage.setItem(USER_KEY, created)
  return created
}

export function readDailyState(todayKey: string): FortuneDailyState | null {
  const stored = safeParse<FortuneDailyState>(window.localStorage.getItem(DAILY_KEY))
  if (!stored || stored.dateKey !== todayKey) {
    return null
  }

  return stored
}

export function writeDailyState(state: FortuneDailyState): void {
  window.localStorage.setItem(DAILY_KEY, JSON.stringify(state))
}

export function readStreak(): FortuneStreak {
  return safeParse<FortuneStreak>(window.localStorage.getItem(STREAK_KEY)) ?? { lastDateKey: null, count: 0, best: 0 }
}

// 오늘의 운세를 처음 공개할 때 1회 호출(멱등). 어제 이어졌으면 +1, 아니면 1로 리셋.
export function touchStreak(todayKey: string): FortuneStreak {
  const current = readStreak()
  if (current.lastDateKey === todayKey) {
    return current
  }

  const count = current.lastDateKey === previousDateKey(todayKey) ? current.count + 1 : 1

  const next: FortuneStreak = {
    lastDateKey: todayKey,
    count,
    best: Math.max(current.best, count),
  }

  window.localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
