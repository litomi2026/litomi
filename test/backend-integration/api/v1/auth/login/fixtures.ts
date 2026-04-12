import { externalRoute, jsonResponse } from '@test/backend/network'
import crypto from 'crypto'

let ipSequence = 10

export function createPkcePair() {
  const codeVerifier = `verifier-${crypto.randomUUID()}`
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  return { codeVerifier, codeChallenge }
}

export function nextIp() {
  ipSequence += 1
  return `203.0.113.${ipSequence}`
}

export function turnstileFailureRoute(errorCodes: readonly string[] = ['timeout-or-duplicate']) {
  return externalRoute({
    matcher: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    method: 'POST',
    response: jsonResponse({
      success: false,
      'error-codes': [...errorCodes],
    }),
  })
}

export function turnstileSuccessRoute() {
  return externalRoute({
    matcher: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    method: 'POST',
    response: jsonResponse({
      success: true,
      action: 'login',
      hostname: 'localhost',
    }),
  })
}
