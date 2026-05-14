/**
 * Get the user's timezone offset in hours
 * @returns Timezone offset in hours (e.g., -5 for EST, +9 for KST)
 */
export function getTimezoneOffsetHours(): number {
  return -(new Date().getTimezoneOffset() / 60)
}

/**
 * Convert local hour to UTC hour
 * @param localHour - Hour in local time (0-23)
 * @returns Hour in UTC (0-23)
 */
export function localToUtcHour(localHour: number): number {
  const now = new Date()
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHour, 0, 0)
  return localDate.getUTCHours()
}

/**
 * Convert UTC hour to local hour
 * @param utcHour - Hour in UTC (0-23)
 * @returns Hour in local time (0-23)
 */
export function utcToLocalHour(utcHour: number): number {
  const now = new Date()
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0))
  return utcDate.getHours()
}
