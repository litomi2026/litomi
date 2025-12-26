import { CANONICAL_URL } from '@/constants'
import { BBATON_CLIENT_ID } from '@/constants/env'
import { sec } from '@/utils/date'

export type BBatonAttempt = {
  userId: number
}

export const BBATON_ATTEMPT_TTL_SECONDS = sec('10 minutes')

export function buildAuthorizeUrl(): string {
  const redirectURI = getBBatonRedirectURI()
  const authorizeUrl = new URL('https://bauth.bbaton.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', BBATON_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectURI)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read_profile')
  return authorizeUrl.toString()
}

export function generateAttemptId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getAttemptKey(attemptId: string): string {
  return `bbaton:attempt:${attemptId}`
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', CANONICAL_URL)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
