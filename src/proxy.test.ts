import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

const refreshSessionMock = mock(async () => ({
  ok: false as const,
  reason: 'invalid' as const,
  cookies: [],
}))

mock.module('./query/session', () => ({
  refreshSession: refreshSessionMock,
}))

let proxy: typeof import('./proxy').proxy

beforeAll(async () => {
  ;({ proxy } = await import('./proxy'))
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  refreshSessionMock.mockClear()
})

function getSetCookieHeader(response: Response) {
  return Array.from(response.headers.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)
    .join('\n')
}

describe('proxy auth cookie cleanup', () => {
  test('refresh token이 없으면 domain/path를 유지한 clear cookie를 내려준다', async () => {
    const response = await proxy(
      new NextRequest('https://litomi.in/settings', {
        headers: {
          cookie: `${CookieKey.ACCESS_TOKEN}=invalid-access-token`,
        },
      }),
    )

    const setCookieHeader = getSetCookieHeader(response)

    expect(refreshSessionMock).not.toHaveBeenCalled()
    expect(setCookieHeader).toContain('at=;')
    expect(setCookieHeader).toContain('rt=;')
    expect(setCookieHeader).toContain('ah=;')
    expect(setCookieHeader).toContain(`Domain=${COOKIE_DOMAIN}`)
    expect(setCookieHeader).toContain('Path=/')
  })

  test('refresh 실패 시 bare delete 대신 clear config를 적용한다', async () => {
    refreshSessionMock.mockResolvedValueOnce({
      ok: false,
      reason: 'invalid',
      cookies: [],
    })

    const response = await proxy(
      new NextRequest('https://litomi.in/settings', {
        headers: {
          cookie: `${CookieKey.ACCESS_TOKEN}=invalid-access-token; ${CookieKey.REFRESH_TOKEN}=invalid-refresh-token`,
        },
      }),
    )

    const setCookieHeader = getSetCookieHeader(response)

    expect(refreshSessionMock).toHaveBeenCalledWith('invalid-refresh-token', { deviceLabel: null })
    expect(setCookieHeader).toContain('at=;')
    expect(setCookieHeader).toContain('rt=;')
    expect(setCookieHeader).toContain('ah=;')
    expect(setCookieHeader).toContain(`Domain=${COOKIE_DOMAIN}`)
    expect(setCookieHeader).toContain('Path=/')
  })
})
