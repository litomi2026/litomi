import { afterAll, beforeAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { Hono } from 'hono'

import type { Env } from '@/backend'

import imageProxyRoutes from '../image-proxy'

const app = new Hono<Env>()
app.route('/', imageProxyRoutes)

const originalFetch = global.fetch
let fetchCalls = 0

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  fetchCalls = 0
  global.fetch = (async () => {
    fetchCalls += 1

    return new Response('image-body', {
      status: 200,
      headers: {
        'Content-Length': '10',
        'Content-Type': 'image/avif',
      },
    })
  }) as unknown as typeof fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('GET /i/v2/manga/:mangaId/:variant/:page', () => {
  test('u 없는 queryless 요청은 404와 no-store를 반환하고 upstream fetch를 하지 않는다', async () => {
    const response = await app.request('/manga/123/original/5')

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(fetchCalls).toBe(0)
  })

  test('허용된 semantic 이미지 소스를 프록시하고 30일 캐시 헤더를 반환한다', async () => {
    const response = await app.request('/manga/123/original/5?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif')

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('public')
    expect(response.headers.get('cache-control')).toContain('max-age=2592000')
    expect(response.headers.get('cache-control')).toContain('s-maxage=2592000')
    expect(response.headers.get('cache-control')).toContain('stale-while-revalidate=604800')
    expect(await response.text()).toBe('image-body')
  })

  test('허용 목록 밖의 호스트는 400과 no-store를 반환한다', async () => {
    const response = await app.request('/manga/123/original/5?u=https%3A%2F%2Fk-hentai.org%2Fimage%2F123.webp')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  test('허용 호스트라도 페이지가 맞지 않으면 400과 no-store를 반환한다', async () => {
    const response = await app.request(
      '/manga/123/thumbnail/1?u=https%3A%2F%2Fcdn.imagedeliveries.com%2F123%2Fthumbnails%2F1.webp',
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  test('thumbnail 1페이지는 cover.webp만 허용한다', async () => {
    const response = await app.request(
      '/manga/123/thumbnail/1?u=https%3A%2F%2Fcdn.imagedeliveries.com%2F123%2Fthumbnails%2Fcover.webp',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })

  test('유효하지 않은 파라미터는 400과 no-store를 반환한다', async () => {
    const response = await app.request('/manga/0/original/0?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})
