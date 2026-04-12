import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'

import { getInvalidParams, PROBLEM_CONTENT_TYPE } from '@/utils/problem-details'

import { zProblemValidator } from '../validator'

describe('zProblemValidator', () => {
  test('중첩된 경로와 배열 인덱스를 invalidParams로 변환한다', async () => {
    const app = new Hono()

    const schema = z.object({
      items: z.array(
        z.object({
          name: z.string().min(1, '이름을 입력해 주세요'),
        }),
      ),
    })

    app.post('/validate', zProblemValidator('json', schema), (c) => c.json({ ok: true }))

    const response = await app.request('/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ name: '' }] }),
    })

    const body = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe(PROBLEM_CONTENT_TYPE)

    expect(body).toMatchObject({
      type: 'https://localhost/problems/invalid-input',
      detail: '입력을 확인해 주세요',
      status: 400,
    })

    expect(getInvalidParams(body)).toEqual([{ name: 'items[0].name', reason: '이름을 입력해 주세요' }])
  })

  test('유효한 입력이면 다음 핸들러로 요청을 넘긴다', async () => {
    const app = new Hono()

    const schema = z.object({
      loginId: z.string().min(3),
    })

    app.post('/validate', zProblemValidator('json', schema), (c) => c.json(c.req.valid('json')))

    const response = await app.request('/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'tester' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: 'tester' })
  })
})
