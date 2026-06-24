import { describe, expect, test } from 'bun:test'
import { PROBLEM_CONTENT_TYPE } from '@litomi/http/problem-details'
import { Hono } from 'hono'

import { problemResponse } from '../problem'

describe('problemResponse', () => {
  test('problem details와 헤더를 RFC 형식으로 응답한다', async () => {
    const app = new Hono()

    app.get('/problem', (c) =>
      problemResponse(c, {
        status: 429,
        detail: '잠시 후에 다시 시도해 주세요',
        headers: { 'Retry-After': '60' },
      }),
    )

    const response = await app.request('http://localhost/problem?cursor=1')
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get('Content-Type')).toBe(PROBLEM_CONTENT_TYPE)
    expect(response.headers.get('Retry-After')).toBe('60')

    expect(body).toEqual({
      type: 'https://localhost/problems/too-many-requests',
      title: '요청이 너무 많아요',
      status: 429,
      detail: '잠시 후에 다시 시도해 주세요',
      instance: '/problem?cursor=1',
    })
  })
})
