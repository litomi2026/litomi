import { env as commonEnv } from '@litomi/env/server.common'
import { env } from '@litomi/env/server.hono'
import { sec } from '@litomi/std'

const { APP_ORIGIN } = commonEnv
const { BBATON_CLIENT_ID } = env

export const BBATON_ATTEMPT_TTL_SECONDS = sec('10 minutes')
export const BBATON_RATE_LIMIT = 20
export const BBATON_RATE_LIMIT_WINDOW_SECONDS = sec('15 minutes')

export function buildAuthorizeUrl(state: string): string {
  const redirectURI = getBBatonRedirectURI()
  const authorizeUrl = new URL('https://bauth.bbaton.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', BBATON_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectURI)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read_profile')
  authorizeUrl.searchParams.set('state', state)
  return authorizeUrl.toString()
}

export function createBBatonState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', APP_ORIGIN)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
