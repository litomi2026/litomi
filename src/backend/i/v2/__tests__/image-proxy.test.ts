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

describe('GET /i/v2/manga/:mangaId/:variant/:page.webp', () => {
  test('u 없는 queryless .webp 요청은 404와 no-store를 반환하고 upstream fetch를 하지 않는다', async () => {
    const response = await app.request('/manga/123/original/5.webp')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(fetchCalls).toBe(0)
  })

  test('허용된 이미지 소스를 프록시하고 30일 캐시 헤더를 반환한다', async () => {
    const response = await app.request(
      '/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('public')
    expect(response.headers.get('cache-control')).toContain('max-age=2592000')
    expect(response.headers.get('cache-control')).toContain('s-maxage=2592000')
    expect(response.headers.get('cache-control')).toContain('stale-while-revalidate=604800')
    expect(await response.text()).toBe('image-body')
  })

  test('허용 목록 밖의 호스트는 400과 no-store를 반환한다', async () => {
    const response = await app.request('/manga/123/original/5.webp?u=https%3A%2F%2Fevil.example.com%2Fimage%2F123.webp')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  test('soujpa 원본 URL이 route param과 맞으면 프록시한다', async () => {
    const response = await app.request(
      '/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.webp',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })

  test('soujpa 원본 URL의 mangaId/page가 route param과 다르면 400을 반환한다', async () => {
    const response = await app.request(
      '/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F999%2F999_4.avif',
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(fetchCalls).toBe(0)
  })

  test('허용된 썸네일 호스트 URL도 thumbnail route와 맞아야 프록시한다', async () => {
    const response = await app.request(
      '/manga/123/thumbnail/1.webp?u=https%3A%2F%2Fcdn.imagedeliveries.com%2F123%2Fthumbnails%2F1.webp',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })

  test('thumbnail route와 맞지 않는 cdn.imagedeliveries URL은 400을 반환한다', async () => {
    const response = await app.request(
      '/manga/123/thumbnail/1.webp?u=https%3A%2F%2Fcdn.imagedeliveries.com%2F123%2Fthumbnails%2F3.webp',
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(fetchCalls).toBe(0)
  })

  test('cover.webp는 thumbnail 1페이지와만 매칭된다', async () => {
    const response = await app.request(
      '/manga/123/thumbnail/1.webp?u=https%3A%2F%2Fcdn.imagedeliveries.com%2F123%2Fthumbnails%2Fcover.webp',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })

  test('hentkor 루트 호스트 URL의 page가 route param과 다르면 400을 반환한다', async () => {
    const response = await app.request('/manga/123/original/5.webp?u=https%3A%2F%2Fhentkor.net%2Fpages%2F123%2F6.avif')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(fetchCalls).toBe(0)
  })

  test('cdn.hentkor.net 서브도메인은 semantic mismatch여도 현재 프록시를 허용한다', async () => {
    const response = await app.request(
      '/manga/123/original/5.webp?u=https%3A%2F%2Fcdn.hentkor.net%2Fpages%2F123%2F6.avif',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
    expect(fetchCalls).toBe(1)
  })

  test('original variant는 k-hentai storage 원본 URL도 materialize source로 허용한다', async () => {
    const response = await app.request(
      '/manga/123/original/5.webp?u=https%3A%2F%2Fstorage-6-10.k-hentai.org%2Fstorage%2Ff2%2F74%2Ff2740688125f4d28e0f2bd891e721ce0b38df1be.webp%3Fmd5%3D-D49G6esslygdj4fpHhAAw%26expires%3D1773791999',
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })

  test('유효하지 않은 파라미터는 400과 no-store를 반환한다', async () => {
    const response = await app.request('/manga/0/original/0.webp?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif')

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  test('기존 무확장 route도 하위 호환으로 허용한다', async () => {
    const response = await app.request('/manga/123/original/5?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-body')
  })
})
