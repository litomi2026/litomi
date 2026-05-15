import { TEST_LOGIN_PASSWORD } from '@test/backend/setup/auth'
import { externalRoute, installExternalFetchGuard, jsonResponse } from '@test/backend/setup/network'

import type { POSTV1AuthLoginRequest } from '@/api/v1/auth/login/POST'

import { createPkcePair } from '../fixtures'

type BuildLoginRequestInput = Partial<POSTV1AuthLoginRequest> & Pick<POSTV1AuthLoginRequest, 'loginId'>
type TurnstileGuardResult = 'error' | 'failure' | 'success'

export function buildLoginRequest(overrides: BuildLoginRequestInput) {
  const { codeChallenge, codeVerifier } = createPkcePair()

  return {
    codeVerifier,
    payload: {
      loginId: overrides.loginId,
      password: overrides.password ?? TEST_LOGIN_PASSWORD,
      remember: overrides.remember ?? false,
      turnstileToken: overrides.turnstileToken ?? 'turnstile-ok',
      codeChallenge: overrides.codeChallenge ?? codeChallenge,
      fingerprint: overrides.fingerprint ?? 'fp-auth-login',
    } satisfies POSTV1AuthLoginRequest,
  }
}

export function installLoginTurnstileGuard(result: TurnstileGuardResult = 'success') {
  return installExternalFetchGuard([resolveTurnstileRoute(result)])
}

export function turnstileErrorRoute(message: string = 'turnstile unavailable') {
  return externalRoute({
    matcher: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    method: 'POST',
    response() {
      throw new Error(message)
    },
  })
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

function resolveTurnstileRoute(result: TurnstileGuardResult) {
  switch (result) {
    case 'error':
      return turnstileErrorRoute()
    case 'failure':
      return turnstileFailureRoute()
    case 'success':
    default:
      return turnstileSuccessRoute()
  }
}
