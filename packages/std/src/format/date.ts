import ms, { type StringValue } from 'ms'

export type DateFormatLocale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'

type ElapsedDistance = {
  calendarDays: number
  days: number
  hours: number
  minutes: number
  months: number
}

type RelativeDistance = {
  unit: Intl.RelativeTimeFormatUnit
  value: number
}

type ZonedDateParts = {
  day: number
  month: number
  year: number
}

const DATE_PARTS_LANGUAGE_TAG = 'en-CA'

const SECOND_MS = ms('1s')
const MINUTE_MS = ms('1m')
const HOUR_MS = ms('1h')
const DAY_MS = ms('1d')

const LOCALE_LANGUAGE_TAGS = {
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
} satisfies Record<DateFormatLocale, string>

const DATE_TIME_FORMAT_OPTIONS = {
  absoluteDateTime: {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  dateParts: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  localizedTime: {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
  },
  localizedWeekdayTime: {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    weekday: 'short',
  },
} satisfies Record<string, Intl.DateTimeFormatOptions>

type DateTimeFormatStyle = keyof typeof DATE_TIME_FORMAT_OPTIONS

const formatterCache = new Map<string, Intl.DateTimeFormat>()
const relativeFormatterCache = new Map<string, Intl.RelativeTimeFormat>()

export function formatDistanceFromNow(date: Date, locale: DateFormatLocale): string {
  const nowMs = Date.now()
  const diffMs = date.getTime() - nowMs

  if (diffMs < SECOND_MS) {
    return ''
  }

  const days = Math.floor(diffMs / DAY_MS)
  if (days >= 30) {
    return formatAbsoluteDateTime(date)
  }

  const { value, unit } = getFutureRelativeDistance(diffMs)
  return getRelativeFormatter(LOCALE_LANGUAGE_TAGS[locale]).format(value, unit)
}

export function formatDistanceToNow(date: Date, locale: DateFormatLocale): string {
  const elapsed = getElapsedDistance(date)
  const languageTag = LOCALE_LANGUAGE_TAGS[locale]
  const relativeFormatter = getRelativeFormatter(languageTag)
  const timeFormatter = getFormatter('localizedTime', languageTag)

  if (elapsed.minutes < 1) {
    return relativeFormatter.format(0, 'second')
  }
  if (elapsed.minutes < 60) {
    return relativeFormatter.format(-elapsed.minutes, 'minute')
  }
  if (elapsed.hours < 4) {
    return relativeFormatter.format(-elapsed.hours, 'hour')
  }
  if (elapsed.calendarDays < 1) {
    return timeFormatter.format(date)
  }
  if (elapsed.calendarDays < 2) {
    return `${relativeFormatter.format(-1, 'day')} ${timeFormatter.format(date)}`
  }
  if (elapsed.days < 7) {
    return getFormatter('localizedWeekdayTime', languageTag).format(date)
  }
  if (elapsed.days < 30) {
    return relativeFormatter.format(-Math.floor(elapsed.days / 7), 'week')
  }
  if (elapsed.months < 12) {
    return relativeFormatter.format(-Math.max(1, elapsed.months), 'month')
  }
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
  const parts = getFormatter('absoluteDateTime', DATE_PARTS_LANGUAGE_TAG).formatToParts(date)
  const year = getDateTimePart(parts, 'year')
  const month = getDateTimePart(parts, 'month')
  const day = getDateTimePart(parts, 'day')
  const hour = getDateTimePart(parts, 'hour')
  const minute = getDateTimePart(parts, 'minute')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getCalendarDayIndex(date: Date): number {
  const { year, month, day } = getDateParts(date)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
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
  const parts = getFormatter('dateParts', DATE_PARTS_LANGUAGE_TAG).formatToParts(date)

  return {
    day: Number(getDateTimePart(parts, 'day')),
    month: Number(getDateTimePart(parts, 'month')),
    year: Number(getDateTimePart(parts, 'year')),
  }
}

function getDateTimePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? ''
}

function getElapsedDistance(date: Date): ElapsedDistance {
  const now = new Date(Date.now())
  const diff = now.getTime() - date.getTime()

  return {
    calendarDays: getCalendarDayIndex(now) - getCalendarDayIndex(date),
    days: Math.floor(diff / DAY_MS),
    hours: Math.floor(diff / HOUR_MS),
    minutes: Math.floor(diff / MINUTE_MS),
    months: getCalendarMonthDiff(now, date),
  }
}

function getFormatter(style: DateTimeFormatStyle, languageTag: string): Intl.DateTimeFormat {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone
  const cacheKey = `${style}:${languageTag}:${timeZone ?? 'default'}`
  const cached = formatterCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat(languageTag, {
    ...DATE_TIME_FORMAT_OPTIONS[style],
    ...(timeZone && { timeZone }),
  })

  formatterCache.set(cacheKey, formatter)
  return formatter
}

function getFutureRelativeDistance(diffMs: number): RelativeDistance {
  const seconds = Math.floor(diffMs / SECOND_MS)
  if (seconds <= 60) {
    return { unit: 'second', value: seconds }
  }

  const minutes = Math.floor(diffMs / MINUTE_MS)
  if (minutes < 60) {
    return { unit: 'minute', value: minutes }
  }

  const hours = Math.floor(diffMs / HOUR_MS)
  if (hours < 24) {
    return { unit: 'hour', value: hours }
  }

  const days = Math.floor(diffMs / DAY_MS)
  if (days < 7) {
    return { unit: 'day', value: days }
  }

  return { unit: 'week', value: Math.floor(days / 7) }
}

function getRelativeFormatter(languageTag: string): Intl.RelativeTimeFormat {
  const cached = relativeFormatterCache.get(languageTag)

  if (cached) {
    return cached
  }

  const formatter = new Intl.RelativeTimeFormat(languageTag, { numeric: 'auto' })
  relativeFormatterCache.set(languageTag, formatter)
  return formatter
}
