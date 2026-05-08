import 'server-only'

import { env as commonEnv } from '@/env/server.common'
import { env } from '@/env/server.hono'
import { sec } from '@/utils/format/date'

const { APP_ORIGIN } = commonEnv
const { BBATON_CLIENT_ID } = env

export const BBATON_ATTEMPT_TTL_SECONDS = sec('10 minutes')

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
  return generateRandomHex(32)
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', APP_ORIGIN)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function generateRandomHex(byteLength: number): string {
  const array = new Uint8Array(byteLength)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
