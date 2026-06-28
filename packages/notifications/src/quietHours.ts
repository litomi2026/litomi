export interface QuietHoursSettings {
  quietEnabled: boolean
  quietHours: {
    start: number
    end: number
  }
}

export function isWithinQuietHours(settings: QuietHoursSettings, now: Date): boolean {
  if (!settings.quietEnabled) {
    return false
  }

  const { start, end } = settings.quietHours
  const hour = now.getUTCHours()

  if (start > end) {
    return hour >= start || hour < end
  }

  return hour >= start && hour < end
}
