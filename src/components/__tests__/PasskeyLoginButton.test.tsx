import '@test/setup.base'
import '@test/setup.dom'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

type DispatchedAuthenticationRequest = {
  authentication: { id: string }
  remember: boolean
  turnstileToken?: string | null
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfter: number | undefined
}

type VerifyAuthenticationResponse =
  | {
      ok: false
      status: 400 | 404
      error: string
    }
  | {
      ok: true
      status: 200
      data: {
        id: number
        loginId: string
        name: string
        lastLoginAt: null
        lastLogoutAt: null
      }
    }

const browserSupportsWebAuthnAutofillMock = mock(() => Promise.resolve(false))
const startAuthenticationMock = mock(() => Promise.resolve({ id: 'cred-1' }))
const generateAuthenticationOptionsMock = mock(async () => ({ challenge: 'passkey-challenge' }))
const rateLimitCheckMock = mock(async () => rateLimitState.result)
const storeChallengeMock = mock(async () => {})
const signalUnknownCredentialMock = mock(() => Promise.resolve(undefined))
const toastWarningMock = mock(() => {})
const toastErrorMock = mock(() => {})
const dispatchedRequests: DispatchedAuthenticationRequest[] = []

const actionState: { response: VerifyAuthenticationResponse } = {
  response: {
    ok: false,
    status: 400,
    error: '보안 검증에 실패했어요',
  },
}

const rateLimitState: { result: RateLimitResult } = {
  result: {
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfter: undefined,
  },
}

const cookieStore = {
  delete: mock(() => {}),
  get: mock(() => undefined),
  set: mock(() => {}),
}

mock.module('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthnAutofill: browserSupportsWebAuthnAutofillMock,
  startAuthentication: startAuthenticationMock,
}))

mock.module('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: generateAuthenticationOptionsMock,
  verifyAuthenticationResponse: mock(async () => {
    throw new Error('verifyAuthenticationResponse should not be called in PasskeyLoginButton test')
  }),
}))

mock.module('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () =>
    new Headers({
      'CF-Connecting-IP': '203.0.113.10',
      'x-forwarded-for': '203.0.113.10',
      'x-real-ip': '203.0.113.10',
    }),
}))

mock.module('sonner', () => ({
  toast: {
    warning: toastWarningMock,
    error: toastErrorMock,
  },
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async () => {
      throw new Error('db.transaction should not be called in PasskeyLoginButton test')
    },
  },
}))

mock.module('@/hook/useServerAction', () => ({
  default: ({
    onError,
    onSuccess,
  }: {
    onError?: (response: Extract<VerifyAuthenticationResponse, { ok: false }>) => void
    onSuccess?: (
      data: Extract<VerifyAuthenticationResponse, { ok: true }>['data'],
      args: [DispatchedAuthenticationRequest]
    ) => void
  }) => {
    function dispatchAction(request: DispatchedAuthenticationRequest) {
      dispatchedRequests.push(request)

      queueMicrotask(() => {
        if (actionState.response.ok) {
          onSuccess?.(actionState.response.data, [request])
          return
        }

        onError?.(actionState.response)
      })
    }

    return [undefined, dispatchAction, false] as const
  },
}))

mock.module('@/utils/cookie', () => ({
  getAccessTokenCookieConfig: mock(async () => ({
    key: 'at',
    value: 'access-token',
    options: { maxAge: 3600 },
  })),
  getAuthHintCookieConfig: mock(({ maxAgeSeconds }: { maxAgeSeconds: number }) => ({
    key: 'ah',
    value: String(maxAgeSeconds),
    options: { maxAge: maxAgeSeconds },
  })),
  getPasskeyAuthenticationAttemptCookieConfig: mock((attemptId: string) => ({
    key: 'pkai',
    value: attemptId,
    options: { maxAge: 180 },
  })),
  getRefreshTokenCookieConfig: mock(async () => ({
    key: 'rt',
    value: 'refresh-token',
    options: { maxAge: 60 * 60 * 24 * 30 },
  })),
}))

mock.module('@/utils/rate-limit', () => ({
  RateLimiter: class MockRateLimiter {
    check() {
      return rateLimitCheckMock()
    }

    reward() {
      return Promise.resolve()
    }
  },
  RateLimitPresets: {
    balanced: () => ({ windowMs: 5 * 60 * 1000, maxAttempts: 10 }),
    strict: () => ({ windowMs: 15 * 60 * 1000, maxAttempts: 10 }),
  },
}))

mock.module('@/utils/redis-challenge', () => ({
  getAndDeleteChallenge: mock(async () => null),
  storeChallenge: storeChallengeMock,
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    getTurnstileErrorMessage() {
      return 'Cloudflare 보안 검증이 만료됐어요'
    }

    validate() {
      return Promise.resolve({ success: true })
    }
  },
}))

const { default: PasskeyLoginButton } = await import('../PasskeyLoginButton')
const testGlobal = globalThis as typeof globalThis & {
  PublicKeyCredential?: typeof PublicKeyCredential
  location?: Location
}
const originalPublicKeyCredential = testGlobal.PublicKeyCredential
const originalLocation = testGlobal.location

beforeEach(() => {
  actionState.response = {
    ok: false,
    status: 400,
    error: '보안 검증에 실패했어요',
  }
  rateLimitState.result = {
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfter: undefined,
  }
  testGlobal.PublicKeyCredential = {
    signalUnknownCredential: signalUnknownCredentialMock,
  } as unknown as typeof PublicKeyCredential
  testGlobal.location = window.location
})

afterEach(() => {
  cleanup()
  dispatchedRequests.length = 0
  browserSupportsWebAuthnAutofillMock.mockClear()
  startAuthenticationMock.mockClear()
  generateAuthenticationOptionsMock.mockClear()
  rateLimitCheckMock.mockClear()
  storeChallengeMock.mockClear()
  signalUnknownCredentialMock.mockClear()
  toastWarningMock.mockClear()
  toastErrorMock.mockClear()
  cookieStore.get.mockClear()
  cookieStore.set.mockClear()
  cookieStore.delete.mockClear()

  if (originalPublicKeyCredential) {
    testGlobal.PublicKeyCredential = originalPublicKeyCredential
  } else {
    Reflect.deleteProperty(testGlobal, 'PublicKeyCredential')
  }

  if (originalLocation) {
    testGlobal.location = originalLocation
    return
  }

  Reflect.deleteProperty(testGlobal, 'location')
})

function renderPasskeyButton({
  rememberChecked = false,
  getToken = mock(async () => 'token-123'),
  reset = mock(() => {}),
}: {
  rememberChecked?: boolean
  getToken?: () => Promise<string | null>
  reset?: () => void
} = {}) {
  const formRef = { current: null as HTMLFormElement | null }

  const view = renderWithTestQueryClient(
    <div>
      <form ref={(node) => void (formRef.current = node)}>
        <input defaultChecked={rememberChecked} name="remember" type="checkbox" />
      </form>
      <PasskeyLoginButton
        formRef={formRef}
        turnstile={{
          getToken,
          reset,
        }}
      />
    </div>,
  )

  return {
    ...view,
    getToken,
    reset,
  }
}

describe('PasskeyLoginButton', () => {
  it('폼의 uncontrolled 로그인 유지 값을 읽어 패스키 로그인 요청에 반영한다', async () => {
    actionState.response = {
      ok: true,
      status: 200,
      data: {
        id: 1,
        loginId: 'tester',
        name: 'tester',
        lastLoginAt: null,
        lastLogoutAt: null,
      },
    }

    const { getByRole, getToken } = renderPasskeyButton({ rememberChecked: true })

    fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))

    await waitFor(() => {
      expect(dispatchedRequests).toHaveLength(1)
    })

    expect(getToken).not.toHaveBeenCalled()
    expect(dispatchedRequests[0]).toMatchObject({
      authentication: { id: 'cred-1' },
      remember: true,
    })
  })

  it('low-risk 패스키 로그인은 Turnstile 토큰 없이 검증을 요청한다', async () => {
    const { getByRole, getToken } = renderPasskeyButton()

    fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))

    await waitFor(() => {
      expect(dispatchedRequests).toHaveLength(1)
    })

    expect(getToken).not.toHaveBeenCalled()
    expect(dispatchedRequests[0]).toMatchObject({
      authentication: { id: 'cred-1' },
      remember: false,
    })
    expect(dispatchedRequests[0]?.turnstileToken).toBeUndefined()
  })

  it('패스키 로그인 실패 시 Turnstile을 초기화한다', async () => {
    const { getByRole, reset } = renderPasskeyButton()

    fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1)
    })

    expect(signalUnknownCredentialMock).not.toHaveBeenCalled()
  })

  it('등록되지 않은 패스키로 로그인하면 Turnstile을 초기화하고 브라우저에 알려준다', async () => {
    actionState.response = {
      ok: false,
      status: 404,
      error: '패스키를 검증할 수 없어요',
    }

    const { getByRole, reset } = renderPasskeyButton()

    fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(signalUnknownCredentialMock).toHaveBeenCalledWith({
        credentialId: 'cred-1',
        rpId: 'localhost',
      })
    })
  })

  it('high-risk 수동 패스키 로그인은 Turnstile 토큰이 없으면 경고하고 중단한다', async () => {
    rateLimitState.result = {
      allowed: true,
      limit: 10,
      remaining: 6,
      retryAfter: undefined,
    }

    const { getByRole, getToken, reset } = renderPasskeyButton({
      getToken: mock(async () => null),
    })

    fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))

    await waitFor(() => {
      expect(getToken).toHaveBeenCalledTimes(1)
    })

    expect(reset).toHaveBeenCalledTimes(1)
    expect(dispatchedRequests).toHaveLength(0)
    expect(toastWarningMock).toHaveBeenCalledWith('Cloudflare 보안 검증을 완료해 주세요')
  })

  it('high-risk autofill 시도는 조용히 중단한다', async () => {
    browserSupportsWebAuthnAutofillMock.mockResolvedValueOnce(true)
    rateLimitState.result = {
      allowed: true,
      limit: 10,
      remaining: 6,
      retryAfter: undefined,
    }

    const getToken = mock(async () => null)
    renderPasskeyButton({ getToken })

    await waitFor(() => {
      expect(generateAuthenticationOptionsMock).toHaveBeenCalledTimes(1)
    })

    expect(startAuthenticationMock).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
    expect(dispatchedRequests).toHaveLength(0)
    expect(toastWarningMock).not.toHaveBeenCalled()
  })
})
