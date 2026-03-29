import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { z } from 'zod'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import { zProblemValidator } from '../validator'

const requestSchema = z.object({
  loginId: z.string().min(2, { error: '아이디는 2자 이상이어야 해요' }).regex(/^[a-z]+$/, {
    error: '아이디는 영문 소문자만 사용할 수 있어요',
  }),
  items: z.array(
    z.object({
      name: z.string().min(2, { error: '이름은 2자 이상이어야 해요' }),
    }),
  ),
})

function createApp() {
  const app = new Hono<Env>()

  app.use('*', contextStorage())
  app.post('/', zProblemValidator('json', requestSchema), (c) => c.body(null, 204))

  return app
}

describe('zProblemValidator', () => {
  test('검증 실패를 invalid-input 문제 세부정보로 변환한다', async () => {
    const response = await createApp().request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: '',
        items: [{ name: '' }],
      }),
    })

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/problem+json')

    const problem = (await response.json()) as ValidationProblemDetails

    expect(problem.type).toBe('https://localhost/problems/invalid-input')
    expect(problem.detail).toBe('입력을 확인해 주세요')
    expect(problem.invalidParams).toEqual([
      {
        name: 'loginId',
        reason: '아이디는 2자 이상이어야 해요',
      },
      {
        name: 'items[0].name',
        reason: '이름은 2자 이상이어야 해요',
      },
    ])
  })
})
