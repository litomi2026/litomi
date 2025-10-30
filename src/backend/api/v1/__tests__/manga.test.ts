import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import mangaRoutes from '../manga/[id]/history'

let shouldThrowDatabaseError = false
let currentUserId: number | undefined
const mockReadingHistory: Map<string, number | null> = new Map()

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

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
app.route('/', mangaRoutes)

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => {
          if (shouldThrowDatabaseError) {
            return Promise.reject(new Error('Database connection failed'))
          }

          const key = `${currentUserId}`
          const lastPage = mockReadingHistory.get(key)

          if (lastPage === null || lastPage === undefined) {
            return Promise.resolve([])
          }

          return Promise.resolve([{ lastPage }])
        },
      }),
    }),
  },
}))

describe('GET /api/v1/manga/:id/history', () => {
  beforeEach(() => {
    currentUserId = undefined
    shouldThrowDatabaseError = false
    mockReadingHistory.clear()
  })

  describe('성공', () => {
    test('인증된 사용자가 읽기 기록을 성공적으로 조회한다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 5)

      // When
      const response = await app.request('/123/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      expect(data).toBe(5)
    })

    test('읽기 기록이 없는 경우 404 응답을 받는다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', null)

      // When
      const response = await app.request('/123/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(404)
    })

    test('응답에 Cache-Control 헤더가 포함되어 있다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 10)

      // When
      const response = await app.request('/456/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })

    test('lastPage가 0인 경우에도 정상적으로 반환된다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 0)

      // When
      const response = await app.request('/789/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBe(0)
    })
  })

  describe('실패', () => {
    test('인증되지 않은 사용자(userId 없음)는 401 응답을 받는다', async () => {
      // When
      const response = await app.request('/123/history', {}, {})

      // Then
      expect(response.status).toBe(401)
    })

    test('유효하지 않은 manga ID는 400 응답을 받는다', async () => {
      // Given
      currentUserId = 1

      // When - 음수 ID
      const negativeResponse = await app.request('/-123/history', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)

      // When - 0
      const zeroResponse = await app.request('/0/history', {}, { userId: 1 })
      expect(zeroResponse.status).toBe(400)

      // When - MAX_MANGA_ID 초과
      const tooLargeResponse = await app.request('/20000000/history', {}, { userId: 1 })
      expect(tooLargeResponse.status).toBe(400)

      // When - 문자열
      const stringResponse = await app.request('/abc/history', {}, { userId: 1 })
      expect(stringResponse.status).toBe(400)
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // Given
      currentUserId = 1
      shouldThrowDatabaseError = true

      // When
      const response = await app.request('/123/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(500)
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 15)

      // When
      const promises = Array.from({ length: 5 }, () => app.request('/123/history', {}, { userId: 1 }))
      const responses = await Promise.all(promises)

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = await Promise.all(responses.map((r) => r.json()))
      expect(data.every((d) => d === 15)).toBe(true)
    })

    test('서로 다른 manga ID로 요청하는 경우 올바른 응답을 받는다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 5)

      // When
      const response1 = await app.request('/123/history', {}, { userId: 1 })
      const response2 = await app.request('/456/history', {}, { userId: 1 })

      // Then
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      const data1 = await response1.json()
      const data2 = await response2.json()
      expect(data1).toBe(5)
      expect(data2).toBe(5)
    })

    test('데이터베이스 오류 후 복구되는 경우 정상 응답을 반환한다', async () => {
      // Given - 첫 번째 요청은 실패
      currentUserId = 1
      shouldThrowDatabaseError = true
      const errorResponse = await app.request('/123/history', {}, { userId: 1 })
      expect(errorResponse.status).toBe(500)

      // When - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      mockReadingHistory.set('1', 8)
      const successResponse = await app.request('/123/history', {}, { userId: 1 })

      // Then
      expect(successResponse.status).toBe(200)
      const data = await successResponse.json()
      expect(data).toBe(8)
    })
  })

  describe('보안', () => {
    test('Cache-Control 헤더가 private으로 설정되어 공유 캐시에 저장되지 않는다', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 3)

      // When
      const response = await app.request('/123/history', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).not.toContain('public')
    })

    test('MAX_MANGA_ID 경계값 테스트', async () => {
      // Given
      currentUserId = 1
      mockReadingHistory.set('1', 1)

      // When - MAX_MANGA_ID(10000000)는 허용
      const validResponse = await app.request('/10000000/history', {}, { userId: 1 })
      expect(validResponse.status).toBe(200)

      // When - MAX_MANGA_ID + 1은 거부
      const invalidResponse = await app.request('/10000001/history', {}, { userId: 1 })
      expect(invalidResponse.status).toBe(400)
    })
  })
})
