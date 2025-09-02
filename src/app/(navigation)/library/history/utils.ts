import { ReadingHistoryItem } from '@/app/api/reading-history/route'

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

const groupOrder: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'older']

export function groupHistoryByDate(items: ReadingHistoryItem[]): Map<DateGroup, ReadingHistoryItem[]> {
  const groups = new Map<DateGroup, ReadingHistoryItem[]>()

  for (const item of items) {
    const group = getDateGroup(item.updatedAt)
    const groupItems = groups.get(group) ?? []
    groupItems.push(item)
    groups.set(group, groupItems)
  }

  const orderedGroups = new Map<DateGroup, ReadingHistoryItem[]>()

  for (const group of groupOrder) {
    const histories = groups.get(group)

    if (histories) {
      orderedGroups.set(group, histories)
    }
  }

  return orderedGroups
}

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date()
  const date = new Date(timestamp)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) return 'today'
  if (daysDiff === 1) return 'yesterday'

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)

  if (itemDate >= weekStart) return 'thisWeek'
  if (itemDate >= lastWeekStart) return 'lastWeek'

  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return 'thisMonth'
  }

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  if (date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()) {
    return 'lastMonth'
  }

  return 'older'
}
