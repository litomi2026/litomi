import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { Env } from '@/backend'

import appRoutes from '../app'
import { resolveCORSOrigin } from '../utils/cors-origin'

const app = new Hono<Env>()

app.use(
  '/api/*',
  cors({
    origin: (origin) => resolveCORSOrigin(origin),
    credentials: true,
    exposeHeaders: ['Retry-After'],
  }),
)

app.use(
  '/i/*',
  cors({
    origin: '*',
    exposeHeaders: ['Retry-After'],
  }),
)

app.route('/', appRoutes)

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
      'http://localhost/i/v2/manga/123/original/5',
      { headers: { origin: 'https://stg.litomi.in' } },
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(false)
  })

  test('/i/* 경로는 Origin 헤더가 없어도 동일한 CORS 헤더를 반환한다', async () => {
    const response = await app.request(
      'http://localhost/i/v2/manga/123/original/5',
      {
        headers: {},
      },
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(false)
  })

  test('/i/* 외 경로는 기존 credential CORS 정책을 유지한다', async () => {
    const allowedOrigin = 'http://localhost:3000'
    const response = await app.request(
      'http://localhost/api/v1/search/suggestions?query=litomi',
      { headers: { origin: allowedOrigin } },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe(allowedOrigin)
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    expect(hasHeaderToken(response.headers.get('vary'), 'origin')).toBe(true)
  })
})
