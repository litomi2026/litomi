import { afterEach, describe, expect, test } from 'bun:test'
import { Hono } from 'hono'

import { createAllowedRequestInitiatorMiddleware } from '../allowed-request-initiator'

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

afterEach(() => {
  setNodeEnv(ORIGINAL_NODE_ENV)
})

describe('createAllowedRequestInitiatorMiddleware', () => {
  test('허용된 Origin 요청이면 다음 핸들러로 요청을 넘긴다', async () => {
    const response = await requestWithHeaders({
      Origin: 'https://litomi.in',
      'Sec-Fetch-Site': 'same-origin',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  test('Origin이 없으면 Referer로 요청 출처를 판단한다', async () => {
    const response = await requestWithHeaders({
      Referer: 'https://stg.litomi.in/manga/1',
      'Sec-Fetch-Site': 'same-origin',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  test('Origin이 있으면 허용된 Referer로 우회하지 않는다', async () => {
    const response = await requestWithHeaders({
      Origin: 'https://example.com',
      Referer: 'https://litomi.in/manga/1',
      'Sec-Fetch-Site': 'same-site',
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('401 Unauthorized')
  })

  test('Fetch Metadata가 차단 값이면 허용된 Origin도 401을 반환한다', async () => {
    const response = await requestWithHeaders({
      Origin: 'https://litomi.in',
      'Sec-Fetch-Site': 'cross-site',
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('401 Unauthorized')
  })

  test('옵션을 켠 경우에만 비프로덕션 localhost 요청을 허용한다', async () => {
    setNodeEnv('test')

    const allowedResponse = await requestWithHeaders(
      { Origin: 'http://localhost:3000', 'Sec-Fetch-Site': 'same-site' },
      { allowLocalhostInNonProduction: true },
    )

    const blockedResponse = await requestWithHeaders(
      { Origin: 'http://localhost:3000', 'Sec-Fetch-Site': 'same-site' },
      { allowLocalhostInNonProduction: false },
    )

    expect(allowedResponse.status).toBe(200)
    expect(blockedResponse.status).toBe(401)
  })
})

function createApp(options: { allowLocalhostInNonProduction?: boolean } = {}) {
  const app = new Hono()

  app.use(
    '*',
    createAllowedRequestInitiatorMiddleware({
      allowedOrigins: ['https://litomi.in', 'https://stg.litomi.in'],
      allowLocalhostInNonProduction: options.allowLocalhostInNonProduction,
    }),
  )
  app.get('/protected', (c) => c.json({ ok: true }))

  return app
}

async function requestWithHeaders(headers: HeadersInit, options?: { allowLocalhostInNonProduction?: boolean }) {
  return await createApp(options).request('/protected', { headers })
}

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    return
  }

  Object.assign(process.env, { NODE_ENV: value })
}
