import crypto from 'node:crypto'
import { installBackendIntegrationHooks } from '@test/backend/setup'

type AuthHeadersInput = {
  ip?: string
  userAgent?: string
}

type IntegrationOptions = {
  redis?: boolean
}

export const AUTH_TEST_CHROME_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36'

export const AUTH_TEST_SAFARI_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15'
export const AUTH_TEST_TOTP_TIME = '2026-01-01T00:00:00.000Z'

export function buildAuthHeaders({ ip = '203.0.113.10', userAgent }: AuthHeadersInput = {}) {
  const headers: Record<string, string> = { 'CF-Connecting-IP': ip }

  if (userAgent) {
    headers['User-Agent'] = userAgent
  }

  return headers
}

export function createPkcePair() {
  const codeVerifier = `verifier-${crypto.randomUUID()}`
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  return { codeVerifier, codeChallenge }
}

export function installAuthIntegrationHooks({ redis = false }: IntegrationOptions = {}) {
  installBackendIntegrationHooks({ redis })
}
