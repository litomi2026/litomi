import { describe, expect, test } from 'bun:test'
import { PROBLEM_CONTENT_TYPE } from '@litomi/http/problem-details'
import { Hono } from 'hono'

import { requireAuth } from '../require-auth'

type TestEnv = {
  Variables: {
    userId?: number
    isAdult?: boolean
  }
}

describe('requireAuth', () => {
  test('userId가 없으면 401 problem response를 반환한다', async () => {
    const app = createApp()

    const response = await app.request('/protected')
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('Content-Type')).toBe(PROBLEM_CONTENT_TYPE)

    expect(body).toMatchObject({
      status: 401,
      title: '로그인이 필요해요',
      detail: '로그인 정보가 없거나 만료됐어요',
    })
  })

  test('userId가 있으면 다음 핸들러로 요청을 넘긴다', async () => {
    const app = createApp({ userId: 7 })

    const response = await app.request('/protected')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, userId: 7 })
  })
})

function createApp(variables: TestEnv['Variables'] = {}) {
  const app = new Hono<TestEnv>()

  app.use('*', async (c, next) => {
    if (variables.userId !== undefined) {
      c.set('userId', variables.userId)
    }

    if (variables.isAdult !== undefined) {
      c.set('isAdult', variables.isAdult)
    }

    await next()
  })

  app.use('*', requireAuth)
  app.get('/protected', (c) => c.json({ ok: true, userId: c.get('userId') }))

  return app
}
