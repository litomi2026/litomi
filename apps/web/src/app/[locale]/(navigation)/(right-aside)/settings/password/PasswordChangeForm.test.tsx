import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { GETV1MeResponse } from '@litomi/contracts'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestQueryClient, renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { QueryKeys } from '@/lib/react-query/query-keys'

const replaceMock = mock(() => {})
const refreshMock = mock(() => {})
const toastSuccessMock = mock(() => {})
const toastWarningMock = mock(() => {})
const toastErrorMock = mock(() => {})
const amplitudeResetMock = mock(() => {})
const identifyMock = mock(() => {})

type PasswordChangeFormModule = typeof import('./PasswordChangeForm')

let PasswordChangeForm: PasswordChangeFormModule['default']
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

mock.module('@/lib/analytics/browser', () => ({
  identify: identifyMock,
}))

beforeAll(async () => {
  ;({ default: PasswordChangeForm } = await import('./PasswordChangeForm'))
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

describe('PasswordChangeForm', () => {
  test('2단계 인증이 켜져 있으면 OTP 입력을 노출하고 요청 body에 token을 포함한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me/password',
      method: 'PATCH',
      response: ({ init }) => {
        expect(init?.body).toBe(
          JSON.stringify({ currentPassword: 'Password123', newPassword: 'NewPassword123', token: '123456' }),
        )

        return jsonResponse({
          clearedCurrentSession: true,
          message: '비밀번호가 변경됐어요',
        })
      },
    })

    const view = renderWithTestQueryClient(<PasswordChangeForm isTwoFactorEnabled={true} />)

    await fillPasswordForm(user, view, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
      token: '123456',
    })

    await user.click(view.getByRole('button', { name: '비밀번호 변경' }))

    await waitFor(() => {
      expect(
        fetchController.calls.some((call) => call.method === 'PATCH' && call.url.pathname === '/api/v1/me/password'),
      ).toBe(true)
    })
  })

  test('invalidParams 오류가 오면 해당 필드에 validity를 적용한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me/password',
      method: 'PATCH',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.cc/problems/invalid-input',
            title: '잘못된 요청이에요',
            status: 400,
            detail: '입력을 확인해 주세요',
            invalidParams: [{ name: 'newPassword', reason: '현재 비밀번호와 새 비밀번호가 같아요' }],
          },
          { status: 400 },
        ),
    })

    const view = renderWithTestQueryClient(<PasswordChangeForm isTwoFactorEnabled={false} />)

    await fillPasswordForm(user, view, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    const newPasswordInput = view.getByLabelText('새 비밀번호') as HTMLInputElement
    await user.click(view.getByRole('button', { name: '비밀번호 변경' }))

    await waitFor(() => {
      expect(newPasswordInput.validationMessage).toBe('현재 비밀번호와 새 비밀번호가 같아요')
    })

    expect(replaceMock).not.toHaveBeenCalled()
  })

  test('재인증 실패 400 오류가 오면 민감 입력을 비우고 일반 경고를 노출한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me/password',
      method: 'PATCH',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.cc/problems/bad-request',
            title: '잘못된 요청이에요',
            status: 400,
            detail: '현재 인증 정보를 확인해 주세요',
          },
          { status: 400 },
        ),
    })

    const view = renderWithTestQueryClient(<PasswordChangeForm isTwoFactorEnabled={true} />)

    await fillPasswordForm(user, view, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
      token: '123456',
    })

    const currentPasswordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    const newPasswordInput = view.getByLabelText('새 비밀번호') as HTMLInputElement
    const confirmPasswordInput = view.getByLabelText('새 비밀번호 확인') as HTMLInputElement
    const tokenInput = view.getByRole('textbox', { name: /2단계 인증 코드/i }) as HTMLInputElement

    await user.click(view.getByRole('button', { name: '비밀번호 변경' }))

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe('')
      expect(newPasswordInput.value).toBe('')
      expect(confirmPasswordInput.value).toBe('')
      expect(tokenInput.value).toBe('')
    })

    expect(toastWarningMock).toHaveBeenCalledWith('현재 인증 정보를 확인해 주세요')
    expect(replaceMock).not.toHaveBeenCalled()
  })

  test('성공하면 인증 상태 캐시를 비우고 로그인 화면으로 이동한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me/password',
      method: 'PATCH',
      response: () =>
        jsonResponse({
          clearedCurrentSession: true,
          message: '비밀번호가 변경됐어요',
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

    const view = renderWithTestQueryClient(<PasswordChangeForm isTwoFactorEnabled={false} />, { queryClient })

    await fillPasswordForm(user, view, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    await user.click(view.getByRole('button', { name: '비밀번호 변경' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/auth/login')
    })

    expect(queryClient.getQueryData(QueryKeys.me)).toBeNull()
    expect(queryClient.getQueryData(['me', 'bookmarks'])).toBeUndefined()
    expect(toastSuccessMock).toHaveBeenCalledWith('비밀번호가 변경됐어요')
    expect(amplitudeResetMock).toHaveBeenCalled()
    expect(identifyMock).toHaveBeenCalledWith(null)
  })

  test('401 오류가 오면 인증 상태를 비우고 새로고침한다', async () => {
    const user = userEvent.setup()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me/password',
      method: 'PATCH',
      response: () =>
        jsonResponse(
          {
            type: 'https://litomi.cc/problems/unauthorized',
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

    const view = renderWithTestQueryClient(<PasswordChangeForm isTwoFactorEnabled={false} />, { queryClient })

    await fillPasswordForm(user, view, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    const currentPasswordInput = view.getByLabelText('현재 비밀번호') as HTMLInputElement
    await user.click(view.getByRole('button', { name: '비밀번호 변경' }))

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled()
    })

    expect(queryClient.getQueryData(QueryKeys.me)).toBeNull()
    expect(queryClient.getQueryData(['me', 'bookmarks'])).toBeUndefined()
    expect(currentPasswordInput.value).toBe('')
    expect(toastWarningMock).not.toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})

async function fillPasswordForm(
  user: ReturnType<typeof userEvent.setup>,
  view: ReturnType<typeof renderWithTestQueryClient>,
  values: {
    confirmPassword: string
    currentPassword: string
    newPassword: string
    token?: string
  },
) {
  await user.type(view.getByLabelText('현재 비밀번호'), values.currentPassword)
  await user.type(view.getByLabelText('새 비밀번호'), values.newPassword)
  await user.type(view.getByLabelText('새 비밀번호 확인'), values.confirmPassword)

  if (values.token) {
    await user.type(view.getByRole('textbox', { name: /2단계 인증 코드/i }), values.token)
  }
}
