import crypto from 'crypto'
import 'server-only'

import { sec } from '@/utils/format/date'

export const REFRESH_SESSION_ABSOLUTE_TTL_SECONDS = sec('30 days')
export const REFRESH_SESSION_IDLE_TTL_SECONDS = sec('30 days')
export const REFRESH_SESSION_REUSE_GRACE_SECONDS = sec('5 seconds')
export const REFRESH_SESSION_TOKEN_BYTES = 32

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}

export function generateSessionToken() {
  return crypto.randomBytes(REFRESH_SESSION_TOKEN_BYTES).toString('base64url')
}

export function getRemainingSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

export function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('base64url')
}

export function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b
}

export function truncateSessionMetadata(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  return value.slice(0, maxLength)
}
