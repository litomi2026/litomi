import dayjs from 'dayjs'
import ms, { StringValue } from 'ms'

type ZonedDateParts = {
  year: number
  month: number
  day: number
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

export function formatDistanceFromNow(date: Date): string {
  const nowMs = Date.now()
  const diffMs = date.getTime() - nowMs

  if (diffMs <= 0) {
    return ''
  }

  const SECOND_MS = ms('1s')
  const MINUTE_MS = ms('1m')
  const HOUR_MS = ms('1h')
  const DAY_MS = ms('1d')

  const seconds = Math.floor(diffMs / SECOND_MS)
  if (seconds <= 0) return ''
  if (seconds <= 60) return `${seconds}초`

  const minutes = Math.floor(diffMs / MINUTE_MS)
  if (minutes < 60) return `${minutes}분 남음`

  const hours = Math.floor(diffMs / HOUR_MS)
  if (hours < 24) return `${hours}시간 남음`

  const days = Math.floor(diffMs / DAY_MS)
  if (days < 7) return `${days}일 남음`
  if (days < 30) return `${Math.floor(days / 7)}주 남음`

  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date(Date.now())
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const calendarDays = getCalendarDayIndex(now) - getCalendarDayIndex(date)
  const months = getCalendarMonthDiff(now, date)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 4) return `${hours}시간 전`
  if (calendarDays < 1) return formatAppleTime(date)
  if (calendarDays < 2) return `어제 ${formatAppleTime(date)}`
  if (days < 7) return formatAppleWeekdayTime(date)
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  if (months < 12) return `${Math.max(1, months)}개월 전`
  return formatAbsoluteDateTime(date)
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sec(text: StringValue): number {
  return ms(text) / 1000
}

function formatAbsoluteDateTime(date: Date): string {
  const parts = getFormatter('absolute-time', 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  const hour = parts.find((part) => part.type === 'hour')?.value
  const minute = parts.find((part) => part.type === 'minute')?.value

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatAppleTime(date: Date): string {
  return getFormatter('apple-time', 'ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatAppleWeekdayTime(date: Date): string {
  const weekday = getFormatter('apple-weekday', 'ko-KR', {
    weekday: 'short',
  }).format(date)

  return `(${weekday}) ${formatAppleTime(date)}`
}

function getCalendarDayIndex(date: Date): number {
  const { year, month, day } = getDateParts(date)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

function getCalendarMonthDiff(now: Date, date: Date): number {
  const nowParts = getDateParts(now)
  const dateParts = getDateParts(date)

  let diff = (nowParts.year - dateParts.year) * 12 + (nowParts.month - dateParts.month)

  if (nowParts.day < dateParts.day) {
    diff -= 1
  }

  return diff
}

function getDateParts(date: Date): ZonedDateParts {
  const formatter = getFormatter('date-parts', 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  }
}

function getDisplayTimeZone(): string | undefined {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone
}

function getFormatter(key: string, locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const timeZone = getDisplayTimeZone()
  const cacheKey = `${key}:${timeZone ?? 'default'}`
  const cached = formatterCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    ...(timeZone && { timeZone }),
  })

  formatterCache.set(cacheKey, formatter)
  return formatter
}
