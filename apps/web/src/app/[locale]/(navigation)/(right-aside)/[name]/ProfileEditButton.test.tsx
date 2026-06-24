import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { GETV1MeResponse } from '@litomi/contracts'

import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestQueryClient, renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'

const replaceMock = mock(() => {})
const refreshMock = mock(() => {})
const toastSuccessMock = mock(() => {})
const toastWarningMock = mock(() => {})
const toastErrorMock = mock(() => {})
const signalCurrentPasskeyUserDetailsMock = mock(async () => true)

type ProfileEditButtonModule = typeof import('./ProfileEditButton')

let ProfileEditButton: ProfileEditButtonModule['default']
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

mock.module('@litomi/auth/passkey', () => ({
  signalCurrentPasskeyUserDetails: signalCurrentPasskeyUserDetailsMock,
}))

mock.module('@litomi/ui', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
  DialogBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ title }: { title: string }) => <div>{title}</div>,
}))

beforeAll(async () => {
  ;({ default: ProfileEditButton } = await import('./ProfileEditButton'))
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
  signalCurrentPasskeyUserDetailsMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

function createFulfilledThenable<T>(value: T): Promise<T> & { status: 'fulfilled'; value: T } {
  const promise = Promise.resolve(value) as Promise<T> & { status: 'fulfilled'; value: T }
  promise.status = 'fulfilled'
  promise.value = value
  return promise
}

function createMe(overrides: Partial<GETV1MeResponse> = {}): GETV1MeResponse {
  return {
    id: 1,
    loginId: 'tester',
    name: 'alice',
    nickname: 'Alice',
    imageURL: 'https://example.com/avatar.png',
    adultVerification: { required: true, status: 'adult' },
    settings: {
      historySyncEnabled: true,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 180,
    },
    ...overrides,
  }
}

function renderProfileEditButton(
  me: {
    id: number
    loginId: string
    name: string
    nickname: string
    imageURL: string | null
  },
  options?: Parameters<typeof renderWithTestQueryClient>[1],
) {
  return renderWithTestQueryClient(<ProfileEditButton mePromise={createFulfilledThenable(me)} />, options)
}

describe('ProfileEditButton', () => {
  test('변경 사항이 없으면 요청하지 않고 경고를 노출한다', async () => {
    const user = userEvent.setup()

    const view = renderProfileEditButton({
      id: 1,
      loginId: 'tester',
      name: 'alice',
      nickname: 'Alice',
      imageURL: null,
    })

    await user.click(await view.findByRole('button', { name: '프로필 수정' }))
    fireEvent.submit(view.getByRole('button', { name: '저장' }).closest('form')!)

    expect(fetchController.calls).toHaveLength(0)
    expect(toastWarningMock).toHaveBeenCalledWith('수정할 정보를 입력해 주세요')
  })

  test('이름이 바뀌면 replace로 이동하고 displayName 변경 시 passkey 신호를 보낸다', async () => {
    const user = userEvent.setup()
    const me = createMe()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'PATCH',
      response: ({ init }) => {
        expect(init?.body).toBe(JSON.stringify({ name: 'alice-new', nickname: 'Alice Prime' }))

        return jsonResponse({
          message: '프로필을 수정했어요',
          name: 'alice-new',
          nickname: 'Alice Prime',
          imageURL: 'https://example.com/avatar.png',
        })
      },
    })

    const queryClient = createTestQueryClient()
    queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, me)

    const view = renderProfileEditButton(
      {
        id: me.id,
        loginId: me.loginId,
        name: me.name,
        nickname: me.nickname,
        imageURL: me.imageURL,
      },
      { queryClient },
    )

    await user.click(await view.findByRole('button', { name: '프로필 수정' }))

    const nameInput = view.getByLabelText('이름')
    const nicknameInput = view.getByLabelText('닉네임')

    await user.clear(nameInput)
    await user.type(nameInput, 'alice-new')
    await user.clear(nicknameInput)
    await user.type(nicknameInput, 'Alice Prime')
    fireEvent.submit(view.getByRole('button', { name: '저장' }).closest('form')!)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/@alice-new')
    })

    expect(refreshMock).not.toHaveBeenCalled()
    expect(toastSuccessMock).toHaveBeenCalledWith('프로필을 수정했어요')
    expect(signalCurrentPasskeyUserDetailsMock).toHaveBeenCalledWith({
      displayName: 'Alice Prime',
      name: 'tester',
      userId: 'MQ',
    })
    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)).toMatchObject({
      name: 'alice-new',
      nickname: 'Alice Prime',
      imageURL: 'https://example.com/avatar.png',
    })
  })

  test('이름이 그대로면 router.refresh를 호출하고 빈 imageURL을 null로 보낸다', async () => {
    const user = userEvent.setup()
    const me = createMe()

    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      method: 'PATCH',
      response: ({ init }) => {
        expect(init?.body).toBe(JSON.stringify({ imageURL: null }))

        return jsonResponse({
          message: '프로필을 수정했어요',
          name: 'alice',
          nickname: 'Alice',
          imageURL: null,
        })
      },
    })

    const queryClient = createTestQueryClient()
    queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, me)

    const view = renderProfileEditButton(
      {
        id: me.id,
        loginId: me.loginId,
        name: me.name,
        nickname: me.nickname,
        imageURL: me.imageURL,
      },
      { queryClient },
    )

    await user.click(await view.findByRole('button', { name: '프로필 수정' }))
    await user.clear(view.getByLabelText('프로필 이미지 URL'))
    fireEvent.submit(view.getByRole('button', { name: '저장' }).closest('form')!)

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1)
    })

    expect(replaceMock).not.toHaveBeenCalled()
    expect(signalCurrentPasskeyUserDetailsMock).not.toHaveBeenCalled()
    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.imageURL).toBeNull()
  })

  test('허용되지 않은 프로토콜은 프로필 이미지 미리보기에 반영하지 않는다', async () => {
    const user = userEvent.setup()

    const view = renderProfileEditButton({
      id: 1,
      loginId: 'tester',
      name: 'alice',
      nickname: 'Alice',
      imageURL: null,
    })

    await user.click(await view.findByRole('button', { name: '프로필 수정' }))
    await user.type(view.getByLabelText('프로필 이미지 URL'), 'javascript:alert(1)')

    expect(view.getByAltText('프로필 이미지').getAttribute('src')).toBeNull()
  })
})
