import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const sendGTMEventMock = mock(() => {})

mock.module('@next/third-parties/google', () => ({
  sendGTMEvent: sendGTMEventMock,
}))

process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST'

const { identify, track } = await import('../browser')

describe('analytics browser wrapper', () => {
  beforeEach(() => {
    sendGTMEventMock.mockClear()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GTM_SCRIPT_URL
  })

  test('track serializes date params and ignores undefined values', () => {
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

  test('identify stringifies numeric ids and clears with null', () => {
    identify(42)
    identify(null)

    expect(sendGTMEventMock).toHaveBeenNthCalledWith(1, { user_id: '42' })
    expect(sendGTMEventMock).toHaveBeenNthCalledWith(2, { user_id: null })
  })
})
