import ms from 'ms'

export const SUBSCRIPTION_TARGET_CHAT_ARTIST = 'chat_artist'
export const RENEWAL_LEAD_MS = ms('1 day')
export const RENEWAL_GRACE_MS = ms('3 days')

export function addSubscriptionPeriod(from: Date): Date {
  const next = new Date(from)
  const day = next.getUTCDate()
  next.setUTCMonth(next.getUTCMonth() + 1)

  if (next.getUTCDate() < day) {
    next.setUTCDate(0)
  }

  return next
}
