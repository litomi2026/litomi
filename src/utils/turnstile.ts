import ms from 'ms'
import 'server-only'

import { TURNSTILE_SECRET_KEY } from '@/constants/env'

export interface TurnstileVerifyResponse {
  action?: string
  cdata?: string
  challenge_ts?: string
  'error-codes'?: string[]
  hostname?: string
  success: boolean
}

interface TurnstileVerifyOptions {
  expectedAction?: string
  expectedHostname?: string
  idempotencyKey?: string
}

export default class TurnstileValidator {
  private timeout

  private turnstileErrorMap: Record<string, string> = {
    'missing-input-secret': '서버 설정 오류가 발생했어요',
    'invalid-input-secret': '서버 설정 오류가 발생했어요',
    'missing-input-response': '보안 검증을 완료해주세요',
    'invalid-input-response': '보안 검증이 만료되었어요',
    'bad-request': '잘못된 요청이에요',
    'timeout-or-duplicate': '보안 검증이 만료되었어요',
    'internal-error': '일시적인 오류가 발생했어요',

    // Custom error codes
    'action-mismatch': '액션이 잘못됐어요',
    'hostname-mismatch': '주소가 잘못됐어요',
    'validation-timeout': '보안 검증이 만료됐어요',
    'invalid-token-format': '토큰이 잘못됐어요',
    'token-too-long': '토큰이 너무 길어요',
  }

  constructor(timeout = ms('10 seconds')) {
    this.timeout = timeout
  }

  getTurnstileErrorMessage(errorCodes?: string[]) {
    return this.turnstileErrorMap[errorCodes?.[0] ?? '']
  }

  async validate(token: unknown, remoteIP: string, options: TurnstileVerifyOptions = {}) {
    if (!token || typeof token !== 'string') {
      return { success: false, 'error-codes': ['invalid-token-format'] }
    }

    if (token.length > 2048) {
      return { success: false, 'error-codes': ['token-too-long'] }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const formData = new FormData()
      formData.append('secret', TURNSTILE_SECRET_KEY)
      formData.append('response', token)

      if (remoteIP) {
        formData.append('remoteip', remoteIP)
      }

      if (options.idempotencyKey) {
        formData.append('idempotency_key', options.idempotencyKey)
      }

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      const result: TurnstileVerifyResponse = await response.json()

      if (result.success) {
        if (options.expectedAction && result.action !== options.expectedAction) {
          return {
            success: false,
            'error-codes': ['action-mismatch'],
            expected: options.expectedAction,
            received: result.action,
          }
        }

        if (options.expectedHostname && result.hostname !== options.expectedHostname) {
          return {
            success: false,
            'error-codes': ['hostname-mismatch'],
            expected: options.expectedHostname,
            received: result.hostname,
          }
        }
      }

      return result
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, 'error-codes': ['validation-timeout'] }
      }
      return { success: false, 'error-codes': ['internal-error'] }
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Extracts Turnstile token from FormData
 *
 * @param formData - The form data containing the token
 * @returns The token string or null
 */
export function getTurnstileToken(formData: FormData): string | null {
  const token = formData.get('cf-turnstile-response')
  return typeof token === 'string' ? token : null
}
