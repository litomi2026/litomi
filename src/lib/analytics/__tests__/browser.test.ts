import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

type AnalyticsBrowserModule = typeof import('../browser')

const sendGTMEventMock = mock(() => {})
let importVersion = 0

const envMock = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? 'local',
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3002',
  NEXT_PUBLIC_CANONICAL_URL: process.env.NEXT_PUBLIC_CANONICAL_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_CORS_PROXY_URL: process.env.NEXT_PUBLIC_CORS_PROXY_URL ?? 'http://localhost:3002',
  NEXT_PUBLIC_EXTERNAL_API_PROXY_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_PROXY_URL ?? 'http://localhost:3001',
  NEXT_PUBLIC_GTM_ID: 'GTM-TEST',
  NEXT_PUBLIC_GTM_SCRIPT_URL: '',
  NEXT_PUBLIC_IOS_TESTFLIGHT_URL: process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL ?? '',
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '123',
} as const

mock.module('@next/third-parties/google', () => ({
  sendGTMEvent: sendGTMEventMock,
}))

mock.module('@/env/client', () => ({
  env: envMock,
}))

async function importFreshAnalyticsBrowser(): Promise<AnalyticsBrowserModule> {
  return import(`../browser?test=${importVersion++}`) as Promise<AnalyticsBrowserModule>
}

describe('브라우저 분석 래퍼', () => {
  beforeEach(() => {
    sendGTMEventMock.mockClear()
  })

  afterEach(() => {
    sendGTMEventMock.mockClear()
  })

  test('track는 날짜 파라미터를 직렬화하고 정의되지 않은 값은 무시한다', async () => {
    const { track } = await importFreshAnalyticsBrowser()

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

  test('identify는 숫자 ID를 문자열로 보내고 null이면 해제한다', async () => {
    const { identify } = await importFreshAnalyticsBrowser()

    identify(42)
    identify(null)

    expect(sendGTMEventMock).toHaveBeenNthCalledWith(1, { user_id: '42' })
    expect(sendGTMEventMock).toHaveBeenNthCalledWith(2, { user_id: null })
  })
})
