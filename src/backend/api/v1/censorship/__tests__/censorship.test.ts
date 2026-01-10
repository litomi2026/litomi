import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import censorshipRoutes from '..'

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

const app = new Hono<TestEnv>()
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  if (c.env.userId) {
    c.set('userId', c.env.userId)
  }
  await next()
})
app.route('/', censorshipRoutes)

describe('POST /api/v1/censorship', () => {
  test('userId가 없으면 401 에러를 반환한다', async () => {
    const response = await app.request('/', { method: 'POST' }, {})
    expect(response.status).toBe(401)
  })

  test('유효하지 않은 body는 400 에러를 반환한다', async () => {
    const response = await app.request(
      '/',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [] }) },
      { userId: 1 },
    )
    expect(response.status).toBe(400)
  })
})

describe('POST /api/v1/censorship/delete', () => {
  test('userId가 없으면 401 에러를 반환한다', async () => {
    const response = await app.request('/', { method: 'DELETE' }, {})
    expect(response.status).toBe(401)
  })

  test('유효하지 않은 body는 400 에러를 반환한다', async () => {
    const response = await app.request(
      '/',
      { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: [] }) },
      { userId: 1 },
    )
    expect(response.status).toBe(400)
  })
})

describe('POST /api/v1/censorship/update', () => {
  test('userId가 없으면 401 에러를 반환한다', async () => {
    const response = await app.request('/', { method: 'PATCH' }, {})
    expect(response.status).toBe(401)
  })

  test('유효하지 않은 body는 400 에러를 반환한다', async () => {
    const response = await app.request(
      '/',
      { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [] }) },
      { userId: 1 },
    )
    expect(response.status).toBe(400)
  })
})
