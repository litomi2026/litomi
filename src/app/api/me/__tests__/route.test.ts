import { beforeEach, describe, expect, mock, setSystemTime, test } from 'bun:test'

import { CookieKey } from '@/constants/storage'
import { JWTType, signJWT } from '@/utils/jwt'

import { GET } from '../route'

let mockCookie: { value: string } | undefined
let shouldThrowDatabaseError = false
let deletedCookies: string[] = []

mock.module('@/constants/env', () => ({
  JWT_SECRET_ACCESS_TOKEN: 'test-secret-access-token-for-testing',
  JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
  NEXT_PUBLIC_CANONICAL_URL: 'http://localhost:3000',
}))

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === CookieKey.ACCESS_TOKEN) {
        return mockCookie
      }
      return undefined
    },
    delete: (name: string) => {
      deletedCookies.push(name)
    },
  }),
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (condition: { queryChunks?: { value?: unknown }[] }) => {
          if (shouldThrowDatabaseError) {
            return Promise.reject(new Error('Database connection failed'))
          }

          let userId: number | null = null

          for (const { value } of condition.queryChunks ?? []) {
            if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
              userId = Number(value)
              break
            }
          }

          if (userId === 1) {
            return Promise.resolve([
              {
                id: 1,
                loginId: 'testuser1',
                name: 'Test User 1',
                nickname: 'Test User 1',
                imageURL: 'https://example.com/avatar1.jpg',
              },
            ])
          }
          if (userId === 2) {
            return Promise.resolve([
              {
                id: 2,
                loginId: 'testuser2',
                name: 'Test User 2',
                nickname: 'Test User 2',
                imageURL: null,
              },
            ])
          }
          if (userId === 999) {
            return Promise.resolve([])
          }
          return Promise.resolve([])
        },
      }),
    }),
  },
}))

describe('GET /api/me', () => {
  const meRequest = new Request('http://localhost/api/me')

  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockCookie = undefined
    deletedCookies = []
    setSystemTime()
  })

  describe('성공', () => {
    test('인증된 사용자가 자신의 프로필 정보를 성공적으로 조회한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET(meRequest)
      const contentType = response.headers.get('content-type')
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(contentType).toContain('application/json')
      expect(data).toEqual({
        id: 1,
        loginId: 'testuser1',
        name: 'Test User 1',
        nickname: 'Test User 1',
        imageURL: 'https://example.com/avatar1.jpg',
      })
      expect(deletedCookies).toEqual([])
    })

    test('프로필 이미지가 없는 사용자의 정보를 조회한다', async () => {
      // Given
      const token = await signJWT({ sub: '2', loginId: 'testuser2' }, JWTType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET(meRequest)
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 2,
        loginId: 'testuser2',
        name: 'Test User 2',
        nickname: 'Test User 2',
        imageURL: null,
      })
      expect(deletedCookies).toEqual([])
    })
  })

  describe('실패', () => {
    test('access token 쿠키가 없는 경우 401 응답을 반환한다', async () => {
      // Given
      mockCookie = undefined

      // When
      const response = await GET(meRequest)

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual([])
    })

    test('만료된 access token으로 요청하는 경우 401 응답을 반환한다', async () => {
      // Given
      const expiredToken = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: expiredToken }
      setSystemTime(new Date(Date.now() + 2 * 60 * 60 * 1000))

      // When
      const response = await GET(meRequest)

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('다른 키로 서명한 token으로 요청하는 경우 401 응답을 반환한다', async () => {
      // Given
      mock.module('@/constants/env', () => ({
        JWT_SECRET_ACCESS_TOKEN: 'different-secret-key-for-invalid-token',
        JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
        NEXT_PUBLIC_CANONICAL_URL: 'http://localhost:3000',
      }))

      const invalidToken = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: invalidToken }

      mock.module('@/constants/env', () => ({
        JWT_SECRET_ACCESS_TOKEN: 'test-secret-access-token-for-testing',
        JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
        NEXT_PUBLIC_CANONICAL_URL: 'http://localhost:3000',
      }))

      // When
      const response = await GET(meRequest)

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('잘못된 형식의 access token으로 요청하는 경우 오류를 반환한다', async () => {
      // Given
      mockCookie = { value: 'invalid-token-format' }

      // When
      const response = await GET(meRequest)

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('삭제된 사용자의 토큰으로 요청하는 경우 404 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '999', loginId: 'deleteduser' }, JWTType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET(meRequest)
      const text = await response.text()

      // Then
      expect(response.status).toBe(404)
      expect(text).toBe('Not Found')
      expect(deletedCookies).toEqual(['at', 'rt'])
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: token }

      // When
      const promises = Array.from({ length: 5 }, () => GET(meRequest))
      const responses = await Promise.all(promises)
      const data = await Promise.all(responses.map((r) => r.json()))

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.id === 1 && d.loginId === 'testuser1')).toBe(true)
      expect(deletedCookies).toEqual([])
    })

    test('데이터베이스 연결 오류 시 적절한 오류 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: token }
      shouldThrowDatabaseError = true

      // When
      const response = await GET(meRequest)

      // Then
      expect(response.status).toBe(500)
      expect(deletedCookies).toEqual([])
    })
  })

  describe('보안', () => {
    test('다른 사용자의 정보에 접근할 수 없다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, JWTType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET(meRequest)
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.id).toBe(1)
      expect(data.loginId).toBe('testuser1')
      expect(data.id).not.toBe(2)
      expect(data.loginId).not.toBe('testuser2')
      expect(deletedCookies).toEqual([])
    })

    test('SQL 인젝션 공격을 방어한다', async () => {
      // Given
      const maliciousTokens = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1'; SELECT * FROM users WHERE '1'='1",
      ]

      for (const maliciousToken of maliciousTokens) {
        mockCookie = { value: maliciousToken }
        deletedCookies = []

        // When
        const response = await GET(meRequest)

        // Then
        expect(response.status).toBe(401)
        expect(deletedCookies).toEqual(['at'])
      }
    })
  })
})
