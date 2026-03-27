import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const sendGTMEventMock = mock(() => {})

mock.module('@next/third-parties/google', () => ({
  sendGTMEvent: sendGTMEventMock,
}))

mock.module('@/env/client', () => ({
  env: {
    NEXT_PUBLIC_GTM_ID: 'GTM-TEST',
    NEXT_PUBLIC_GTM_SCRIPT_URL: '',
  },
}))

const { identify, track } = await import('../browser')

describe('analytics browser wrapper', () => {
  beforeEach(() => {
    sendGTMEventMock.mockClear()
  })

  afterEach(() => {
    sendGTMEventMock.mockClear()
  })

  test('track는 Date 파라미터를 직렬화하고 undefined 값은 무시한다', () => {
    track('login', {
      method: 'password',
      happened_at: new Date('2026-03-27T00:00:00.000Z'),
      empty: undefined,
    })

    expect(sendGTMEventMock).toHaveBeenCalledWith({
      event: 'login',
      method: 'password',
      happened_at: '2026-03-27T00:00:00.000Z',
    })
  })

  test('identify는 숫자 ID를 문자열로 보내고 null이면 해제한다', () => {
    identify(42)
    identify(null)

    expect(sendGTMEventMock).toHaveBeenNthCalledWith(1, { user_id: '42' })
    expect(sendGTMEventMock).toHaveBeenNthCalledWith(2, { user_id: null })
  })
})
