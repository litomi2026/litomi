import { describe, expect, test } from 'bun:test'

import app from '../index'

const TEST_ENV = {
  server: {
    requestIP: () => ({
      address: '127.0.0.1',
      family: 'IPv4',
      port: 12345,
    }),
  },
}

function hasHeaderToken(value: string | null, token: string): boolean {
  if (!value) {
    return false
  }

  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(token.toLowerCase())
}

describe('CORS by path', () => {
  test('/i/* 경로는 wildcard CORS를 반환하고 Origin 기준 vary를 추가하지 않는다', async () => {
    const response = await app.request(
      'http://localhost/i/v2/manga/123/original/5.webp',
      { headers: { origin: 'https://stg.litomi.in' } },
      TEST_ENV,
    )

    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(false)
  })

  test('/i/* 경로는 Origin 헤더가 없어도 동일한 CORS 헤더를 반환한다', async () => {
    const response = await app.request(
      'http://localhost/i/v2/manga/123/original/5.webp',
      {
        headers: {},
      },
      TEST_ENV,
    )

    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(false)
  })

  test('/i/* 외 경로는 기존 credential CORS 정책을 유지한다', async () => {
    const allowedOrigin = 'http://localhost:3000'
    const response = await app.request(
      'http://localhost/?name=litomi',
      { headers: { origin: allowedOrigin } },
      TEST_ENV,
    )

    expect(response.headers.get('access-control-allow-origin')).toBe(allowedOrigin)
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(true)
  })
})
