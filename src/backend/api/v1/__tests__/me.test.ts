import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import meRoutes from '../me'

let shouldThrowDatabaseError = false
let deletedCookies: string[] = []
let currentUserId: number | undefined

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
app.route('/', meRoutes)

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => {
            if (shouldThrowDatabaseError) {
              return Promise.reject(new Error('Database connection failed'))
            }

            if (currentUserId === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  loginId: 'testuser1',
                  name: 'Test User 1',
                  nickname: 'Tester1',
                  imageURL: 'https://example.com/avatar1.jpg',
                  adultFlag: null,
                },
              ])
            }
            if (currentUserId === 2) {
              return Promise.resolve([
                {
                  id: 2,
                  loginId: 'testuser2',
                  name: 'Test User 2',
                  nickname: 'Tester2',
                  imageURL: null,
                  adultFlag: null,
                },
              ])
            }
            if (currentUserId === 999) {
              return Promise.resolve([])
            }
            return Promise.resolve([])
          },
        }),
      }),
    }),
  },
}))

mock.module('hono/cookie', () => ({
  deleteCookie: (_: unknown, name: string) => {
    deletedCookies.push(name)
  },
}))

describe('GET /api/v1/me', () => {
  beforeEach(() => {
    currentUserId = undefined
    shouldThrowDatabaseError = false
    deletedCookies = []
  })

  describe('성공', () => {
    test('인증된 사용자가 자신의 프로필 정보를 성공적으로 조회한다', async () => {
      currentUserId = 1
      const response = await app.request('/', {}, { userId: 1 })
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      expect(data).toEqual({
        id: 1,
        loginId: 'testuser1',
        name: 'Test User 1',
        nickname: 'Tester1',
        imageURL: 'https://example.com/avatar1.jpg',
        adultVerification: {
          required: true,
          status: 'unverified',
        },
      })
      expect(deletedCookies).toEqual([])
    })

    test('프로필 이미지가 없는 사용자의 정보를 조회한다', async () => {
      currentUserId = 2
      const response = await app.request('/', {}, { userId: 2 })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual({
        id: 2,
        loginId: 'testuser2',
        name: 'Test User 2',
        nickname: 'Tester2',
        imageURL: null,
        adultVerification: {
          required: true,
          status: 'unverified',
        },
      })
      expect(deletedCookies).toEqual([])
    })

    test('응답에 Cache-Control 헤더가 포함되어 있다', async () => {
      // Given
      currentUserId = 1

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })

  describe('실패', () => {
    test('인증되지 않은 사용자(userId 없음)는 401 응답을 받는다', async () => {
      // When
      const response = await app.request('/', {}, {})

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual([])
    })

    test('존재하지 않는 사용자 ID로 요청하는 경우 404 응답을 받고 쿠키가 삭제된다', async () => {
      // Given
      currentUserId = 999

      // When
      const response = await app.request('/', {}, { userId: 999 })

      // Then
      expect(response.status).toBe(404)
      expect(deletedCookies).toEqual(['at', 'rt'])
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // Given
      currentUserId = 1
      shouldThrowDatabaseError = true

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(500)
      expect(deletedCookies).toEqual([])
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      currentUserId = 1
      const promises = Array.from({ length: 5 }, () => app.request('/', {}, { userId: 1 }))
      const responses = await Promise.all(promises)
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = await Promise.all(responses.map((r) => r.json()))
      expect(data.every((d) => d.id === 1 && d.loginId === 'testuser1')).toBe(true)
      expect(deletedCookies).toEqual([])
    })

    test('다른 사용자의 정보는 각자의 userId로만 접근 가능하다', async () => {
      // Given - 사용자 1로 조회
      currentUserId = 1
      const response1 = await app.request('/', {}, { userId: 1 })
      const data1 = await response1.json()

      // When - 사용자 2로 조회
      currentUserId = 2
      const response2 = await app.request('/', {}, { userId: 2 })
      const data2 = await response2.json()

      // Then
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(data1.id).toBe(1)
      expect(data2.id).toBe(2)
      expect(data1.id).not.toBe(data2.id)
      expect(data1.loginId).not.toBe(data2.loginId)
    })

    test('데이터베이스 오류 후 복구되는 경우 정상 응답을 반환한다', async () => {
      // Given - 첫 번째 요청은 실패
      currentUserId = 1
      shouldThrowDatabaseError = true
      const errorResponse = await app.request('/', {}, { userId: 1 })
      expect(errorResponse.status).toBe(500)

      // When - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      const successResponse = await app.request('/', {}, { userId: 1 })
      expect(successResponse.status).toBe(200)

      const data = await successResponse.json()
      expect(data.id).toBe(1)
      expect(data.loginId).toBe('testuser1')
    })
  })

  describe('보안', () => {
    test('응답에 민감한 정보가 노출되지 않는다', async () => {
      // Given
      currentUserId = 1

      // When
      const response = await app.request('/', {}, { userId: 1 })
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data).not.toHaveProperty('password')
      expect(data).not.toHaveProperty('passwordHash')
      expect(data).not.toHaveProperty('email')
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('loginId')
      expect(data).toHaveProperty('name')
      expect(data).toHaveProperty('nickname')
      expect(data).toHaveProperty('imageURL')
    })

    test('Cache-Control 헤더가 private으로 설정되어 공유 캐시에 저장되지 않는다', async () => {
      // Given
      currentUserId = 1

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).not.toContain('public')
    })
  })
})
