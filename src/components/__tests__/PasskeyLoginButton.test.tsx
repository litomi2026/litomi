import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { act } from 'react'

const browserSupportsWebAuthnAutofillMock = mock(() => Promise.resolve(false))
const startAuthenticationMock = mock(() => Promise.resolve({ id: 'cred-1' }))
const getAuthenticationOptionsMock = mock(() => Promise.resolve({ ok: true, data: {} }))
const signalUnknownPasskeyCredentialMock = mock(() => Promise.resolve(undefined))

let currentErrorResponse: { ok: false; status: 400 | 404; error: string } = {
  ok: false,
  status: 400,
  error: '보안 검증에 실패했어요',
}

const useServerActionMock = mock(
  ({ onError }: { onError?: (response: typeof currentErrorResponse) => void }) =>
    [
      undefined,
      () => {
        onError?.(currentErrorResponse)
      },
      false,
    ] as const,
)

mock.module('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthnAutofill: browserSupportsWebAuthnAutofillMock,
  startAuthentication: startAuthenticationMock,
}))

mock.module('@/app/(navigation)/(right-search)/[name]/settings/passkey/action-auth', () => ({
  getAuthenticationOptions: getAuthenticationOptionsMock,
  verifyAuthentication: mock(() => Promise.resolve(currentErrorResponse)),
}))

mock.module('@/hook/useServerAction', () => ({
  default: useServerActionMock,
}))

mock.module('@/utils/passkey', () => ({
  signalUnknownPasskeyCredential: signalUnknownPasskeyCredentialMock,
}))

const { default: PasskeyLoginButton } = await import('../PasskeyLoginButton')

afterEach(() => {
  cleanup()
  browserSupportsWebAuthnAutofillMock.mockClear()
  startAuthenticationMock.mockClear()
  getAuthenticationOptionsMock.mockClear()
  signalUnknownPasskeyCredentialMock.mockClear()
  useServerActionMock.mockClear()
  currentErrorResponse = {
    ok: false,
    status: 400,
    error: '보안 검증에 실패했어요',
  }
})

describe('PasskeyLoginButton', () => {
  it('패스키 로그인 실패 시 Turnstile을 초기화한다', async () => {
    const reset = mock(() => {})
    const getToken = mock(async () => 'token-123')
    const { getByRole } = render(
      <PasskeyLoginButton
        turnstile={{
          getToken,
          reset,
        }}
      />,
    )

    await act(async () => {
      fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))
      await Promise.resolve()
    })

    expect(reset).toHaveBeenCalledTimes(1)
    expect(signalUnknownPasskeyCredentialMock).not.toHaveBeenCalled()
  })

  it('등록되지 않은 패스키로 로그인하면 Turnstile을 초기화하고 브라우저에 알려준다', async () => {
    currentErrorResponse = {
      ok: false,
      status: 404,
      error: '패스키를 검증할 수 없어요',
    }

    const reset = mock(() => {})
    const getToken = mock(async () => 'token-123')
    const { getByRole } = render(
      <PasskeyLoginButton
        turnstile={{
          getToken,
          reset,
        }}
      />,
    )

    await act(async () => {
      fireEvent.click(getByRole('button', { name: '패스키로 로그인' }))
      await Promise.resolve()
    })

    expect(reset).toHaveBeenCalledTimes(1)
    expect(signalUnknownPasskeyCredentialMock).toHaveBeenCalledWith('cred-1')
  })
})
