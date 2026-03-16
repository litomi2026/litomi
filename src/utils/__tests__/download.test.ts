import { afterAll, beforeEach, describe, expect, test } from 'bun:test'

import { downloadImage } from '@/utils/download'

const originalFetch = global.fetch
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

let fetchCalls: string[] = []

beforeEach(() => {
  fetchCalls = []

  global.fetch = (async (input) => {
    const url = String(input)
    fetchCalls.push(url)

    if (fetchCalls.length === 1) {
      throw new Error('network error')
    }

    if (fetchCalls.length === 2) {
      return new Response('not-found', {
        status: 404,
        statusText: 'Not Found',
      })
    }

    return new Response('image-body', {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
      },
    })
  }) as typeof fetch

  URL.createObjectURL = (() => 'blob:test') as typeof URL.createObjectURL
  URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL
})

afterAll(() => {
  global.fetch = originalFetch
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

describe('downloadImage fallback', () => {
  test('앞 후보 fetch가 예외를 던져도 다음 후보를 계속 시도한다', async () => {
    await expect(
      downloadImage(
        [
          'https://example.com/i/v2/manga/123/original/5',
          'https://example.com/i/v2/manga/123/original/5?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif',
          'https://example.com/i/v2/manga/123/original/5?u=https%3A%2F%2Fstorage-6-10.k-hentai.org%2Fstorage%2Ff2%2F74%2Ff2740688125f4d28e0f2bd891e721ce0b38df1be.webp',
        ],
        'test.webp',
      ),
    ).resolves.toBeUndefined()

    expect(fetchCalls).toEqual([
      'https://example.com/i/v2/manga/123/original/5',
      'https://example.com/i/v2/manga/123/original/5?u=https%3A%2F%2Fsoujpa.in%2Fstart%2F123%2F123_4.avif',
      'https://example.com/i/v2/manga/123/original/5?u=https%3A%2F%2Fstorage-6-10.k-hentai.org%2Fstorage%2Ff2%2F74%2Ff2740688125f4d28e0f2bd891e721ce0b38df1be.webp',
    ])
  })
})
