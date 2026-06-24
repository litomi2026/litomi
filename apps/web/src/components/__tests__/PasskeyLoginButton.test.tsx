import '@test/setup.base'
import '@test/setup.dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render } from '@testing-library/react'

import { ProblemDetailsError } from '@/utils/react-query-error'

type DispatchedAuthenticationRequest = {
  authentication: { id: string }
  remember: boolean
  turnstileToken?: string | null
}

type PasskeyAuthenticationOptionsResponse = {
  options: { challenge: string }
  turnstileRequired: boolean
}

type PasskeyUser = {
  id: number
  loginId: string
  name: string
  lastLoginAt: null
  lastLogoutAt: null
}

const browserSupportsWebAuthnAutofillMock = mock(() => Promise.resolve(false))
const startAuthenticationMock = mock(() => Promise.resolve({ id: 'cred-1' }))
const requestPasskeyAuthenticationOptionsMock = mock(async () => passkeyOptionsState.response)
const verifyPasskeyAuthenticationMock = mock(async (request: DispatchedAuthenticationRequest) => {
  dispatchedRequests.push(request)

  if (verifyState.error) {
    throw verifyState.error
  }

  return verifyState.response
})
const signalUnknownPasskeyCredentialMock = mock(() => Promise.resolve(true))
const toastWarningMock = mock(() => {})
const toastErrorMock = mock(() => {})
const dispatchedRequests: DispatchedAuthenticationRequest[] = []

const passkeyOptionsState: { response: PasskeyAuthenticationOptionsResponse } = {
  response: {
    options: { challenge: 'passkey-challenge' },
    turnstileRequired: false,
  },
}

const verifyState: { error: ProblemDetailsError | null; response: PasskeyUser } = {
  error: createProblemError(400, '보안 검증에 실패했어요'),
  response: {
    id: 1,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  },
}

mock.module('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthnAutofill: browserSupportsWebAuthnAutofillMock,
  startAuthentication: startAuthenticationMock,
}))

mock.module('sonner', () => ({
  toast: {
    warning: toastWarningMock,
    error: toastErrorMock,
  },
}))

mock.module('@/app/[locale]/auth/login/api', () => ({
  requestPasskeyAuthenticationOptions: requestPasskeyAuthenticationOptionsMock,
  verifyPasskeyAuthentication: verifyPasskeyAuthenticationMock,
}))

mock.module('@litomi/auth/passkey', () => ({
  signalUnknownPasskeyCredential: signalUnknownPasskeyCredentialMock,
}))

const { default: PasskeyLoginButton } = await import('../PasskeyLoginButton')

beforeEach(() => {
  passkeyOptionsState.response = {
    options: { challenge: 'passkey-challenge' },
    turnstileRequired: false,
  }
  verifyState.error = createProblemError(400, '보안 검증에 실패했어요')
  verifyState.response = {
    id: 1,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  }
})

afterEach(() => {
  cleanup()
  dispatchedRequests.length = 0
  browserSupportsWebAuthnAutofillMock.mockClear()
  startAuthenticationMock.mockClear()
  requestPasskeyAuthenticationOptionsMock.mockClear()
  verifyPasskeyAuthenticationMock.mockClear()
  signalUnknownPasskeyCredentialMock.mockClear()
  toastWarningMock.mockClear()
  toastErrorMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

async function clickPasskeyLoginButton(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button)
    await flushMicrotasks()
  })
}

async function flushMicrotasks(iterations = 10) {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve()
  }
}

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
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  const view = render(
    <QueryClientProvider client={queryClient}>
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
      </div>
    </QueryClientProvider>,
  )

  return {
    ...view,
    getToken,
    reset,
  }
}

async function settlePasskeyFlow(iterations = 10) {
  await act(async () => {
    await flushMicrotasks(iterations)
  })
}

describe('PasskeyLoginButton', () => {
  it('폼의 uncontrolled 로그인 유지 값을 읽어 패스키 로그인 요청에 반영한다', async () => {
    verifyState.error = null

    const { getByRole, getToken } = renderPasskeyButton({ rememberChecked: true })

    await clickPasskeyLoginButton(getByRole('button', { name: '패스키로 로그인' }))

    expect(getToken).not.toHaveBeenCalled()
    expect(requestPasskeyAuthenticationOptionsMock).toHaveBeenCalledTimes(1)
    expect(dispatchedRequests[0]).toMatchObject({
      authentication: { id: 'cred-1' },
      remember: true,
    })
  })

  it('low-risk 패스키 로그인은 Turnstile 토큰 없이 검증을 요청한다', async () => {
    const { getByRole, getToken } = renderPasskeyButton()

    await clickPasskeyLoginButton(getByRole('button', { name: '패스키로 로그인' }))

    expect(getToken).not.toHaveBeenCalled()
    expect(requestPasskeyAuthenticationOptionsMock).toHaveBeenCalledTimes(1)
    expect(dispatchedRequests[0]).toMatchObject({
      authentication: { id: 'cred-1' },
      remember: false,
    })
    expect(dispatchedRequests[0]?.turnstileToken).toBeUndefined()
  })

  it('패스키 로그인 실패 시 Turnstile을 초기화한다', async () => {
    const { getByRole, reset } = renderPasskeyButton()

    await clickPasskeyLoginButton(getByRole('button', { name: '패스키로 로그인' }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(signalUnknownPasskeyCredentialMock).not.toHaveBeenCalled()
  })

  it('등록되지 않은 패스키로 로그인하면 Turnstile을 초기화하고 브라우저에 알려준다', async () => {
    verifyState.error = createProblemError(404, '패스키를 검증할 수 없어요')

    const { getByRole, reset } = renderPasskeyButton()

    await clickPasskeyLoginButton(getByRole('button', { name: '패스키로 로그인' }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(signalUnknownPasskeyCredentialMock).toHaveBeenCalledWith('cred-1')
  })

  it('high-risk 수동 패스키 로그인은 Turnstile 토큰이 없으면 경고하고 중단한다', async () => {
    passkeyOptionsState.response = {
      options: { challenge: 'passkey-challenge' },
      turnstileRequired: true,
    }

    const { getByRole, getToken, reset } = renderPasskeyButton({
      getToken: mock(async () => null),
    })

    await clickPasskeyLoginButton(getByRole('button', { name: '패스키로 로그인' }))

    expect(getToken).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
    expect(dispatchedRequests).toHaveLength(0)
    expect(toastWarningMock).toHaveBeenCalledWith('Cloudflare 보안 검증을 완료해 주세요')
  })

  it('high-risk autofill 시도는 조용히 중단한다', async () => {
    browserSupportsWebAuthnAutofillMock.mockResolvedValueOnce(true)
    passkeyOptionsState.response = {
      options: { challenge: 'passkey-challenge' },
      turnstileRequired: true,
    }

    const getToken = mock(async () => null)
    renderPasskeyButton({ getToken })

    await settlePasskeyFlow()

    expect(requestPasskeyAuthenticationOptionsMock).toHaveBeenCalledTimes(1)
    expect(startAuthenticationMock).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
    expect(dispatchedRequests).toHaveLength(0)
    expect(toastWarningMock).not.toHaveBeenCalled()
  })
})

function createProblemError(status: number, detail: string) {
  return new ProblemDetailsError({
    type: `https://localhost/problems/http-${status}`,
    title: '오류가 발생했어요',
    status,
    detail,
  })
}
