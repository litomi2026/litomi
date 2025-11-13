import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { Manga } from '@/types/manga'

import { GET } from '../route'
import { mockKHentaiMangas } from './mock'

describe('GET /api/proxy/k/search', () => {
  const baseUrl = 'http://localhost:3000/api/proxy/k/search'
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mock(async (url: string | Request | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url

      if (urlString.includes('/api/v1/search/trending')) {
        return new Response(JSON.stringify({ success: true, tracked: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (urlString.includes('k-hentai.org/ajax/search')) {
        const searchParams = new URLSearchParams(urlString.split('?')[1])
        const sort = searchParams.get('sort')
        const nextId = searchParams.get('next-id')
        const nextViews = searchParams.get('next-views')
        const nextViewsId = searchParams.get('next-views-id')

        let result = [...mockKHentaiMangas]

        if (sort === 'id_asc') {
          result = result.sort((a, b) => a.id - b.id)
        } else if (sort === 'popular') {
          result = result.sort((a, b) => b.views - a.views || b.id - a.id)
        } else if (sort === 'random') {
          result = result.sort(() => Math.random() - 0.5)
        }

        if (nextId) {
          const nextIdNum = parseInt(nextId)
          result = result.filter((m) => m.id > nextIdNum)
        } else if (nextViews && nextViewsId) {
          const viewsNum = parseInt(nextViews)
          const idNum = parseInt(nextViewsId)
          result = result.filter((m) => m.views < viewsNum || (m.views === viewsNum && m.id > idNum))
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return originalFetch(url, init)
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('성공', () => {
    test('제외 필터가 없는 쿼리를 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: 'test',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
    })

    test('제외할 태그가 있는 만화를 필터링해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-other:ai_generated',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas.find((m: Manga) => m.id === 1)).toBeUndefined()
      expect(data.mangas.find((m: Manga) => m.id === 3)).toBeUndefined()
    })

    test('태그 값을 정규화하여 비교해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-other:ai_generated',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas.find((m: Manga) => m.id === 1)).toBeUndefined()
      expect(data.mangas.find((m: Manga) => m.id === 3)).toBeUndefined()
    })

    test('정렬 파라미터를 처리해야 한다', async () => {
      const request = new Request(`${baseUrl}?sort=id_asc`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
      expect(data.mangas[0].id).toBe(1)
      expect(data.mangas[4].id).toBe(5)
    })

    test('페이지네이션을 위한 next-id를 처리해야 한다', async () => {
      const request = new Request(`${baseUrl}?next-id=2`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas.every((m: Manga) => m.id > 2)).toBe(true)
      expect(data.nextCursor).toBe('5')
    })

    test('skip 파라미터를 사용한 오프셋 페이지네이션을 처리해야 한다', async () => {
      const request = new Request(`${baseUrl}?skip=2`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas[0].id).toBe(3)
    })

    test('빈 결과에 대해 적절한 페이지네이션 정보를 반환해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-ai_generated -muscle -naruto',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
      expect(data.nextCursor).toBe('5')
    })

    test('페이지 범위 파라미터를 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        'min-page': '10',
        'max-page': '100',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
    })

    test('날짜 범위 파라미터를 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        from: '1609459200',
        to: '1640995200',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
    })

    test('복잡한 쿼리와 여러 파라미터를 함께 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: 'test -other:ai_generated -muscle',
        sort: 'id_asc',
        'min-page': '1',
        'max-page': '100',
        skip: '0',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas[0].id).toBe(2)
    })

    test('대소문자를 구분하지 않고 태그를 필터링해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-OTHER:AI_GENERATED',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas.find((m: Manga) => m.id === 1)).toBeUndefined()
      expect(data.mangas.find((m: Manga) => m.id === 3)).toBeUndefined()
    })

    test('여러 개의 동일한 카테고리 제외 필터를 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-male:muscle -female:big_breasts -female:small_breasts',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(2)
    })

    test('여러 개의 제외 태그를 필터링해야 한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-other:ai_generated -female:big_breasts',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas.find((m: Manga) => m.id === 1)).toBeUndefined()
    })

    test('빈 쿼리를 처리해야 한다', async () => {
      const request = new Request(baseUrl)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
    })

    test('카테고리가 없으면 필터링하지 않는다', async () => {
      const searchParams = new URLSearchParams({
        query: '-ai_generated',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
    })

    test('카테고리가 있는 것과 없는 것이 혼합되어 있어도 제대로 필터링한다', async () => {
      const searchParams = new URLSearchParams({
        query: '-other:ai_generated -muscle',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(3)
      expect(data.mangas[0].id).toBe(2)
    })

    test('popular 정렬일 때 next-views와 next-views-id를 처리해야 한다', async () => {
      const searchParams = new URLSearchParams({
        sort: 'popular',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mangas).toHaveLength(5)
      // For popular sorting, cursor should contain both views and id
      const lastManga = data.mangas[data.mangas.length - 1]
      expect(data.nextCursor).toBe(`${lastManga.viewCount}-${lastManga.id}`)
    })

    test('popular 정렬에서 next-views와 next-views-id를 사용한 페이지네이션', async () => {
      const searchParams = new URLSearchParams({
        sort: 'popular',
        'next-views': '1000',
        'next-views-id': '3',
      })

      const request = new Request(`${baseUrl}?${searchParams}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Results should be filtered based on views and id
      expect(data.mangas).toHaveLength(5)
    })
  })

  describe('실패', () => {
    test('잘못된 매개변수에 대해 400을 반환해야 한다', async () => {
      const request = new Request(`${baseUrl}?min-page=-1`)
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    test('최소값과 최대값 범위 유효성을 검증해야 한다', async () => {
      const request = new Request(`${baseUrl}?min-view=100&max-view=50`)
      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })
})
