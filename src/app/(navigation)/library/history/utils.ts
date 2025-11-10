import ms from 'ms'

import { ReadingHistoryItem } from '@/backend/api/v1/reading-history'

export type DateGroup = 'lastMonth' | 'lastWeek' | 'older' | 'thisMonth' | 'thisWeek' | 'today' | 'yesterday'

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: '오늘',
  yesterday: '어제',
  thisWeek: '이번 주',
  lastWeek: '지난 주',
  thisMonth: '이번 달',
  lastMonth: '지난 달',
  older: '이전',
}

const GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'older']
const GROUP_ORDER_MAP = new Map(GROUP_ORDER.map((group, index) => [group, index]))

let dateBoundaries: {
  today: number
  yesterday: number
  weekStart: number
  lastWeekStart: number
  currentMonth: number
  currentYear: number
  timestamp: number
} | null = null

const CACHE_TTL = ms('1 hour')

export function groupHistoryByDate(items: ReadingHistoryItem[]): [DateGroup, ReadingHistoryItem[]][] | null {
  if (items.length === 0) {
    return null
  }

  const groupArrays: (ReadingHistoryItem[] | null)[] = []

  for (const item of items) {
    const group = getDateGroup(item.updatedAt)
    const groupIndex = GROUP_ORDER_MAP.get(group)!

    if (!groupArrays[groupIndex]) {
      groupArrays[groupIndex] = []
    }
    groupArrays[groupIndex]!.push(item)
  }

  const result: [DateGroup, ReadingHistoryItem[]][] = []

  for (let i = 0; i < GROUP_ORDER.length; i++) {
    if (groupArrays[i] && groupArrays[i]!.length > 0) {
      result.push([GROUP_ORDER[i], groupArrays[i]!])
    }
  }

  return result
}

function getCachedBoundaries() {
  const now = Date.now()

  if (!dateBoundaries || now - dateBoundaries.timestamp > CACHE_TTL) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)

    dateBoundaries = {
      today: today.getTime(),
      yesterday: yesterday.getTime(),
      weekStart: weekStart.getTime(),
      lastWeekStart: lastWeekStart.getTime(),
      currentMonth: today.getMonth(),
      currentYear: today.getFullYear(),
      timestamp: now,
    }
  }

  return dateBoundaries
}

function getDateGroup(timestamp: number): DateGroup {
  const boundaries = getCachedBoundaries()
  const date = new Date(timestamp)
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

  if (itemDate >= boundaries.today) return 'today'
  if (itemDate >= boundaries.yesterday) return 'yesterday'
  if (itemDate >= boundaries.weekStart) return 'thisWeek'
  if (itemDate >= boundaries.lastWeekStart) return 'lastWeek'

  const itemMonth = date.getMonth()
  const itemYear = date.getFullYear()

  if (itemMonth === boundaries.currentMonth && itemYear === boundaries.currentYear) {
    return 'thisMonth'
  }

  const lastMonth = new Date(boundaries.currentYear, boundaries.currentMonth - 1, 1)

  if (itemMonth === lastMonth.getMonth() && itemYear === lastMonth.getFullYear()) {
    return 'lastMonth'
  }

  return 'older'
}
