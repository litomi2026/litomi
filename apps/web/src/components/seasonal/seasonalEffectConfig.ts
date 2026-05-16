const MINUTE_MS = 60 * 1000
const SEOUL_TIME_ZONE = 'Asia/Seoul'

export type SeasonalEffectId = 'cherry-blossom'

type MonthDayTime = {
  day: number
  hour?: number
  minute?: number
  month: number
}

type SeasonalEffectDefinition = {
  id: SeasonalEffectId
  window: SeasonalEffectWindow
}

type SeasonalEffectWindow = {
  end: MonthDayTime
  start: MonthDayTime
  timeZone: string
}

type ZonedDateParts = {
  day: number
  hour: number
  minute: number
  month: number
  year: number
}

export const SEASONAL_EFFECTS = [
  {
    id: 'cherry-blossom',
    window: {
      timeZone: SEOUL_TIME_ZONE,
      start: { month: 4, day: 1, hour: 0, minute: 0 },
      end: { month: 4, day: 8, hour: 0, minute: 0 },
    },
  },
] as const satisfies readonly SeasonalEffectDefinition[]

const formatterByTimeZone = new Map<string, Intl.DateTimeFormat>()

export function getActiveSeasonalEffectId(now = new Date()): SeasonalEffectId | null {
  for (const effect of SEASONAL_EFFECTS) {
    if (isSeasonalWindowActive(effect.window, now)) {
      return effect.id
    }
  }

  return null
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cachedFormatter = formatterByTimeZone.get(timeZone)

  if (cachedFormatter) {
    return cachedFormatter
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  })

  formatterByTimeZone.set(timeZone, formatter)
  return formatter
}

function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
  const formatter = getFormatter(timeZone)
  const values = new Map(formatter.formatToParts(date).map((part) => [part.type, part.value]))

  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
  }
}

function isSeasonalWindowActive(window: SeasonalEffectWindow, now: Date): boolean {
  const zonedNow = getZonedDateParts(now, window.timeZone)
  const current = toAnnualMinuteIndex(zonedNow.year, zonedNow)
  const start = toAnnualMinuteIndex(zonedNow.year, window.start)
  const end = toAnnualMinuteIndex(zonedNow.year, window.end)

  if (start < end) {
    return current >= start && current < end
  }

  return current >= start || current < end
}

function toAnnualMinuteIndex(year: number, value: MonthDayTime): number {
  return Math.floor(Date.UTC(year, value.month - 1, value.day, value.hour ?? 0, value.minute ?? 0) / MINUTE_MS)
}
