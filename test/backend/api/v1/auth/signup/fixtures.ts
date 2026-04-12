import { externalRoute, jsonResponse } from '@test/backend/setup/network'

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
