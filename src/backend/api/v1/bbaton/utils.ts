import { env as commonEnv } from '@/env/server.common'
import { env } from '@/env/server.hono'

const { APP_ORIGIN } = commonEnv
const { BBATON_CLIENT_ID } = env

export function buildAuthorizeUrl(): string {
  const redirectURI = getBBatonRedirectURI()
  const authorizeUrl = new URL('https://bauth.bbaton.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', BBATON_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectURI)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read_profile')
  return authorizeUrl.toString()
}

export function getBBatonRedirectURI(): string {
  const url = new URL('/oauth/bbaton/callback', APP_ORIGIN)
  return url.toString()
}

export function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
