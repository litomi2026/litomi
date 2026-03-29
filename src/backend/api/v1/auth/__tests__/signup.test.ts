import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import type { POSTV1AuthSignupResponse } from '../signup'

type SignupRoutesModule = typeof import('../signup')

let signupRoutes: SignupRoutesModule['default']
let signupAttemptsByIdentifier = new Map<string, number>()
const SIGNUP_RATE_LIMIT_MAX_ATTEMPTS = 10

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    insert: () => ({
      values: (values: { loginId?: string }) => ({
        onConflictDoNothing: () => ({
          returning: () => {
            if (values.loginId === 'dberror') {
              return Promise.reject(new Error('Database connection failed'))
            }

            if (values.loginId === 'existinguser') {
              return Promise.resolve([])
            }

            return Promise.resolve([{ id: 123 }])
          },
        }),
      }),
    }),
  },
}))

mock.module('@/utils/nickname', () => ({
  generateRandomNickname: () => '자동닉네임',
  generateRandomProfileImage: () => 'https://example.com/avatar.png',
}))

mock.module('@/utils/rate-limit', () => ({
  RateLimiter: class MockRateLimiter {
    constructor(private readonly config: { maxAttempts: number }) {}

    check = (identifier?: string) => {
      const key = identifier ?? ''
      const count = (signupAttemptsByIdentifier.get(key) ?? 0) + 1

      signupAttemptsByIdentifier.set(key, count)

      return Promise.resolve(
        count > this.config.maxAttempts ? { allowed: false, retryAfter: 120 } : { allowed: true, retryAfter: undefined },
      )
    }
  },
  RateLimitPresets: {
    strict: () => ({
      windowMs: 15 * 60 * 1000,
      maxAttempts: SIGNUP_RATE_LIMIT_MAX_ATTEMPTS,
    }),
  },
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    validate = ({ token }: { token: string | null }) =>
      Promise.resolve(
        token === 'invalid' ? { success: false, 'error-codes': ['invalid-input-response'] } : { success: true },
      )
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  signupRoutes = (await import('../signup')).default
})

beforeEach(() => {
  signupAttemptsByIdentifier = new Map()
})

function createApp() {
  const app = new Hono<Env>()
  app.use('*', contextStorage())
  app.route('/signup', signupRoutes)
  return app
}

function getSetCookieHeader(response: Response) {
  return Array.from(response.headers.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)
    .join('\n')
}

function requestSignup(body: unknown, ip = '127.0.0.1') {
  return createApp().request('/signup', {
    method: 'POST',
    headers: {
      'CF-Connecting-IP': ip,
      'Content-Type': 'application/json',
      'x-real-ip': ip,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/auth/signup', () => {
  test.serial('회원가입에 성공하면 사용자를 생성하고 인증 쿠키를 설정한다', async () => {
    const response = await requestSignup({
      loginId: 'testuser',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '테스터',
      turnstileToken: 'token',
    })

    expect(response.status).toBe(201)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('ah=')

    const data = (await response.json()) as POSTV1AuthSignupResponse
    expect(data).toEqual({
      userId: 123,
      loginId: 'testuser',
      name: 'testuser',
      nickname: '테스터',
    })
  })

  test.serial('닉네임이 비어 있으면 자동 생성한다', async () => {
    const response = await requestSignup({
      loginId: 'testuser',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '',
      turnstileToken: 'token',
    })

    expect(response.status).toBe(201)

    const data = (await response.json()) as POSTV1AuthSignupResponse
    expect(data.nickname).toBe('자동닉네임')
  })

  test.serial('유효하지 않은 아이디면 400 invalidParams 를 반환한다', async () => {
    const response = await requestSignup({
      loginId: 'a',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '',
      turnstileToken: 'token',
    })

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/problem+json')

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('입력을 확인해 주세요')
    expect(problem.invalidParams).toContainEqual({
      name: 'loginId',
      reason: '아이디는 최소 2자 이상이어야 해요',
    })
    expect(getSetCookieHeader(response)).toBe('')
  })

  test.serial('중복 아이디면 409 와 필드 오류를 반환한다', async () => {
    const response = await requestSignup({
      loginId: 'existinguser',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '',
      turnstileToken: 'token',
    })

    expect(response.status).toBe(409)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('이미 사용 중인 아이디예요')
    expect(problem.invalidParams).toContainEqual({
      name: 'loginId',
      reason: '이미 사용 중인 아이디예요',
    })
  })

  test.serial('보안 확인 토큰이 비어 있으면 400 invalidParams 를 반환한다', async () => {
    const response = await requestSignup({
      loginId: 'testuser',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '',
      turnstileToken: '',
    })

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('입력을 확인해 주세요')

    const turnstileError = problem.invalidParams?.find((param) => param.name === 'turnstileToken')
    expect(turnstileError).toEqual(expect.objectContaining({ name: 'turnstileToken' }))
    expect(turnstileError?.reason).toEqual(expect.any(String))
  })

  test.serial('보안 확인 검증에 실패하면 일반적인 400 오류를 반환한다', async () => {
    const response = await requestSignup({
      loginId: 'testuser',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '',
      turnstileToken: 'invalid',
    })

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.type).toBe('https://localhost/problems/human-verification-failed')
    expect(problem.detail).toBe('보안 확인에 실패했어요')
    expect(problem.invalidParams).toBeUndefined()
  })

  test.serial('요청이 너무 많으면 429 와 Retry-After 를 반환한다', async () => {
    const ip = '203.0.113.25'
    let response!: Response

    for (let attempt = 0; attempt <= SIGNUP_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      response = await requestSignup(
        {
          loginId: `testuser${attempt}`,
          password: 'Password123',
          passwordConfirm: 'Password123',
          nickname: '',
          turnstileToken: 'token',
        },
        ip,
      )
    }

    expect(response.status).toBe(429)
    const retryAfter = response.headers.get('Retry-After')
    expect(retryAfter).toEqual(expect.any(String))
    expect(Number(retryAfter)).toBeGreaterThan(0)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toContain('너무 많이 시도했어요.')
    expect(problem.detail).toContain('다시 시도해 주세요.')
  })

  test.serial('데이터베이스 오류가 발생하면 500 을 반환하고 쿠키는 설정하지 않는다', async () => {
    const response = await requestSignup({
      loginId: 'dberror',
      password: 'Password123',
      passwordConfirm: 'Password123',
      nickname: '테스터',
      turnstileToken: 'token',
    })

    expect(response.status).toBe(500)
    expect(getSetCookieHeader(response)).toBe('')
  })
})
