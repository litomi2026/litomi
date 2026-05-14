import type { GETV1MeResponse } from '@litomi/contracts'

import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestQueryClient, renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

import { QueryKeys } from '@/lib/react-query/query-keys'

const replaceMock = mock(() => {})
const refreshMock = mock(() => {})
const toastSuccessMock = mock(() => {})
const toastWarningMock = mock(() => {})
const toastErrorMock = mock(() => {})
const amplitudeResetMock = mock(() => {})
const identifyMock = mock(() => {})

type AccountDeletionFormModule = typeof import('./AccountDeletionForm')

let AccountDeletionForm: AccountDeletionFormModule['default']
let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}))

mock.module('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    warning: toastWarningMock,
    error: toastErrorMock,
  },
}))

mock.module('@/lib/amplitude/browser', () => ({
  default: {
    reset: amplitudeResetMock,
  },
}))

mock.module('@/lib/analytics/browser', () => ({
  identify: identifyMock,
}))

beforeAll(async () => {
  ;({ default: AccountDeletionForm } = await import('./AccountDeletionForm'))
})

beforeEach(() => {
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  replaceMock.mockClear()
  refreshMock.mockClear()
  toastSuccessMock.mockClear()
  toastWarningMock.mockClear()
  toastErrorMock.mockClear()
  amplitudeResetMock.mockClear()
  identifyMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

describe('AccountDeletionForm', () => {
  test('비밀번호 표시 버튼이 입력 표시 여부를 전환한다', async () => {
    const user = userEvent.setup()

    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={false} loginId="testuser" />)

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)

    const passwordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    const toggleButton = view.getByRole('button', { name: '비밀번호 표시' })

    expect(passwordInput.type).toBe('password')
    expect(toggleButton.getAttribute('aria-pressed')).toBe('false')

    await user.type(passwordInput, 'Password123')
    await user.click(toggleButton)

    expect(passwordInput.type).toBe('text')
    expect(toggleButton.getAttribute('aria-pressed')).toBe('true')

    await user.click(toggleButton)

    expect(passwordInput.type).toBe('password')
    expect(toggleButton.getAttribute('aria-pressed')).toBe('false')
  })

  test('2단계 인증이 켜져 있으면 OTP 입력을 노출하고 요청 body에 token을 포함한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'DELETE',
      response: ({ init }) => {
        expect(init?.body).toBe(JSON.stringify({ password: 'Password123', token: '123456' }))

        return jsonResponse({
          loginId: 'testuser',
          message: 'testuser 계정을 삭제했어요',
        })
      },
    })

    const queryClient = createTestQueryClient()
    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={true} loginId="testuser" />, {
      queryClient,
    })

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)

    expect(view.getByRole('textbox', { name: /2단계 인증 코드/i })).toBeTruthy()

    await user.type(view.getByLabelText('현재 비밀번호'), 'Password123')
    await user.type(view.getByRole('textbox', { name: /2단계 인증 코드/i }), '123456')
    fireEvent.submit(view.getByRole('button', { name: '계정 영구 삭제' }).closest('form')!)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.method === 'DELETE' && call.url.pathname === '/api/v1/me')).toBe(
        true,
      )
    })
  })

  test('invalidParams 오류가 오면 마지막 단계에 남아 있고 해당 필드에 validity를 적용한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'DELETE',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.in/problems/invalid-input',
            title: '잘못된 요청이에요',
            status: 400,
            detail: '입력을 확인해 주세요',
            invalidParams: [{ name: 'password', reason: '비밀번호는 최소 8자 이상이어야 해요' }],
          },
          { status: 400 },
        ),
    })

    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={false} loginId="testuser" />)

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)

    const passwordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    await user.type(passwordInput, 'Password123')
    fireEvent.submit(view.getByRole('button', { name: '계정 영구 삭제' }).closest('form')!)

    await waitFor(() => {
      expect(passwordInput.validationMessage).toBe('비밀번호는 최소 8자 이상이어야 해요')
    })

    expect(view.getByText('마지막 확인')).toBeTruthy()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  test('generic 400 오류가 오면 민감 입력을 비우고 경고를 노출한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'DELETE',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.in/problems/bad-request',
            title: '잘못된 요청이에요',
            status: 400,
          },
          { status: 400 },
        ),
    })

    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={true} loginId="testuser" />)

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)

    const passwordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    const tokenInput = view.getByRole('textbox', { name: /2단계 인증 코드/i }) as HTMLInputElement
    await user.type(passwordInput, 'Password123')
    await user.type(tokenInput, '123456')
    fireEvent.submit(view.getByRole('button', { name: '계정 영구 삭제' }).closest('form')!)

    await waitFor(() => {
      expect(passwordInput.value).toBe('')
      expect(tokenInput.value).toBe('')
    })

    expect(view.getByText('마지막 확인')).toBeTruthy()
    expect(replaceMock).not.toHaveBeenCalled()
    expect(toastWarningMock).toHaveBeenCalledWith('잘못된 요청이에요')
  })

  test('성공하면 me 캐시를 비우고 홈으로 이동한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'DELETE',
      response: () =>
        jsonResponse({
          loginId: 'testuser',
          message: 'testuser 계정을 삭제했어요',
        }),
    })

    const queryClient = createTestQueryClient()
    queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, {
      id: 1,
      loginId: 'testuser',
      name: 'testuser',
      nickname: 'Tester',
      imageURL: null,
      adultVerification: { required: false, status: 'adult' },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 180,
      },
    })
    queryClient.setQueryData(['me', 'bookmarks'], { items: [1, 2, 3] })

    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={false} loginId="testuser" />, {
      queryClient,
    })

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)
    await user.type(view.getByLabelText('현재 비밀번호'), 'Password123')
    fireEvent.submit(view.getByRole('button', { name: '계정 영구 삭제' }).closest('form')!)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/')
    })

    expect(queryClient.getQueryData(QueryKeys.me)).toBeNull()
    expect(queryClient.getQueryData(['me', 'bookmarks'])).toBeUndefined()
    expect(toastSuccessMock).toHaveBeenCalledWith('testuser 계정을 삭제했어요')
    expect(amplitudeResetMock).toHaveBeenCalled()
    expect(identifyMock).toHaveBeenCalledWith(null)
  })

  test('401 오류가 오면 인증 상태를 비우고 새로고침한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'DELETE',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.in/problems/unauthorized',
            title: '로그인이 필요해요',
            status: 401,
            detail: '로그인 정보가 없거나 만료됐어요',
          },
          { status: 401 },
        ),
    })

    const queryClient = createTestQueryClient()
    queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, {
      id: 1,
      loginId: 'testuser',
      name: 'testuser',
      nickname: 'Tester',
      imageURL: null,
      adultVerification: { required: false, status: 'adult' },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 180,
      },
    })
    queryClient.setQueryData(['me', 'bookmarks'], { items: [1, 2, 3] })

    const view = renderWithTestQueryClient(<AccountDeletionForm isTwoFactorEnabled={true} loginId="testuser" />, {
      queryClient,
    })

    await user.click(view.getByRole('button', { name: '계속 진행' }))
    await fillConfirmationText(user, view, 'testuser 계정을 삭제해요')

    const finalConfirmButton = view.getByRole('button', { name: '최종 확인' })

    await waitFor(() => {
      expect(finalConfirmButton.hasAttribute('disabled')).toBe(false)
    })

    await user.click(finalConfirmButton)

    const passwordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    const tokenInput = view.getByRole('textbox', { name: /2단계 인증 코드/i }) as HTMLInputElement
    await user.type(passwordInput, 'Password123')
    await user.type(tokenInput, '123456')
    fireEvent.submit(view.getByRole('button', { name: '계정 영구 삭제' }).closest('form')!)

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled()
    })

    expect(queryClient.getQueryData(QueryKeys.me)).toBeNull()
    expect(queryClient.getQueryData(['me', 'bookmarks'])).toBeUndefined()
    expect(passwordInput.value).toBe('')
    expect(tokenInput.value).toBe('')
    expect(toastWarningMock).not.toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})

async function fillConfirmationText(
  user: ReturnType<typeof userEvent.setup>,
  view: ReturnType<typeof renderWithTestQueryClient>,
  value: string,
) {
  const input = view.getByPlaceholderText('위 문구를 입력해 주세요')
  await user.type(input, value)
}
