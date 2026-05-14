import { TEST_LOGIN_PASSWORD } from '@test/backend/setup/auth'
import { externalRoute, installExternalFetchGuard, jsonResponse } from '@test/backend/setup/network'

import type { POSTV1AuthSignupRequest } from '@/api/v1/auth/signup'

type BuildSignupRequestInput = Partial<POSTV1AuthSignupRequest> & Pick<POSTV1AuthSignupRequest, 'loginId'>
type TurnstileGuardResult = 'error' | 'failure' | 'success'

export function buildSignupRequest(overrides: BuildSignupRequestInput): POSTV1AuthSignupRequest {
  const password = overrides.password ?? TEST_LOGIN_PASSWORD

  return {
    loginId: overrides.loginId,
    nickname: overrides.nickname !== undefined ? overrides.nickname : 'SignupTester',
    password,
    passwordConfirm: overrides.passwordConfirm ?? password,
    turnstileToken: overrides.turnstileToken ?? 'turnstile-ok',
  }
}

export function installSignupTurnstileGuard(result: TurnstileGuardResult = 'success') {
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

export function turnstileSignupSuccessRoute() {
  return externalRoute({
    matcher: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    method: 'POST',
    response: jsonResponse({
      success: true,
      action: 'signup',
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
      return turnstileSignupSuccessRoute()
  }
}
