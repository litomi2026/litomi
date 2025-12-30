import ms from 'ms'
import 'server-only'

import { env } from '@/env/server.common'

import { sleep } from './time'

const { TURNSTILE_SECRET_KEY } = env

const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TURNSTILE_TOKEN_MAX_LENGTH = 2048
const DEFAULT_TIMEOUT_MS = ms('10 seconds')
const DEFAULT_MAX_RETRIES = 3
const BACKOFF_BASE_DELAY_MS = ms('1 second')

export type TurnstileValidationResult = TurnstileVerifyResponse & { expected?: string; received?: string }

export interface TurnstileVerifyResponse {
  action?: string
  cdata?: string
  challenge_ts?: string
  'error-codes'?: string[]
  hostname?: string
  metadata?: { result_with_testing_key: boolean }
  success: boolean
}

interface TurnstileVerifyOptions {
  expectedAction?: string
  expectedHostname?: string
  remoteIP: string
  token: string | null
}

export default class TurnstileValidator {
  private maxRetries: number
  private timeoutMs: number

  private turnstileErrorMap: Record<string, string> = {
    'missing-input-secret': '서버 설정 오류가 발생했어요',
    'invalid-input-secret': '서버 설정 오류가 발생했어요',
    'missing-input-response': 'Cloudflare 보안 검증을 완료해 주세요',
    'invalid-input-response': 'Cloudflare 보안 검증이 만료됐어요',
    'bad-request': '잘못된 요청이에요',
    'timeout-or-duplicate': 'Cloudflare 보안 검증이 만료됐어요',
    'internal-error': '일시적인 오류가 발생했어요',

    // Custom error codes
    'action-mismatch': '액션이 잘못됐어요',
    'hostname-mismatch': '주소가 잘못됐어요',
    'validation-timeout': 'Cloudflare 보안 검증이 만료됐어요',
    'invalid-token-format': '토큰이 잘못됐어요',
    'token-too-long': '토큰이 너무 길어요',
    'max-retries-exceeded': '일시적인 오류가 발생했어요',
  }

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS, maxRetries: number = DEFAULT_MAX_RETRIES) {
    this.timeoutMs = timeoutMs
    this.maxRetries = Math.max(1, maxRetries)
  }

  getTurnstileErrorMessage(errorCodes?: string[]) {
    return this.turnstileErrorMap[errorCodes?.[0] ?? ''] ?? '보안 검증에 실패했어요. 다시 시도해 주세요'
  }

  async validate({
    expectedAction,
    expectedHostname,
    token,
    remoteIP,
  }: TurnstileVerifyOptions): Promise<TurnstileValidationResult> {
    if (!token || typeof token !== 'string') {
      return { success: false, 'error-codes': ['invalid-token-format'] }
    }

    if (token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
      return { success: false, 'error-codes': ['token-too-long'] }
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const formData = new FormData()
        formData.append('secret', TURNSTILE_SECRET_KEY)
        formData.append('response', token)
        formData.append('idempotency_key', crypto.randomUUID())
        formData.append('remoteip', remoteIP)

        const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        const result: TurnstileVerifyResponse = await response.json()

        const normalized: TurnstileValidationResult = response.ok
          ? result
          : { ...result, success: false, 'error-codes': result['error-codes'] ?? ['bad-request'] }

        if (normalized.success && normalized.metadata?.result_with_testing_key !== true) {
          if (expectedAction && result.action !== expectedAction) {
            return {
              success: false,
              'error-codes': ['action-mismatch'],
              expected: expectedAction,
              received: normalized.action,
            }
          }

          if (expectedHostname && result.hostname !== expectedHostname) {
            return {
              success: false,
              'error-codes': ['hostname-mismatch'],
              expected: expectedHostname,
              received: normalized.hostname,
            }
          }
        }

        if (response.ok) {
          return normalized
        }

        if (attempt === this.maxRetries) {
          return normalized
        }

        await sleep(Math.pow(2, attempt) * BACKOFF_BASE_DELAY_MS)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { success: false, 'error-codes': ['validation-timeout'] }
        }
        return { success: false, 'error-codes': ['internal-error'] }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    // NOTE: 이 코드는 실제로 실행되지 않음
    return { success: false, 'error-codes': ['max-retries-exceeded'] }
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
