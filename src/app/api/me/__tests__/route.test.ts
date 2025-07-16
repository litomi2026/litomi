import { beforeEach, describe, expect, mock, setSystemTime, test } from 'bun:test'

import { CookieKey } from '@/constants/storage'
import { signJWT, TokenType } from '@/utils/jwt'

import { GET } from '../route'

let mockCookie: { value: string } | undefined
let shouldThrowDatabaseError = false
let deletedCookies: string[] = []

mock.module('@/constants/env', () => ({
  JWT_SECRET_ACCESS_TOKEN: 'test-secret-access-token-for-testing',
  JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
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

mock.module('@/database/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async (condition: { queryChunks?: unknown[] }) => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }

          let userId: string | null = null

          if (condition && condition.queryChunks && condition.queryChunks.length > 3) {
            const userIdChunk = condition.queryChunks[3]
            if (typeof userIdChunk === 'number' || (typeof userIdChunk === 'string' && /^\d+$/.test(userIdChunk))) {
              userId = String(userIdChunk)
            }
          }

          if (userId === '1') {
            return [
              {
                id: 1,
                loginId: 'testuser1',
                nickname: 'Test User 1',
                imageURL: 'https://example.com/avatar1.jpg',
              },
            ]
          }
          if (userId === '2') {
            return [
              {
                id: 2,
                loginId: 'testuser2',
                nickname: 'Test User 2',
                imageURL: null,
              },
            ]
          }
          if (userId === '999') {
            return []
          }
          return []
        },
      }),
    }),
  },
}))

describe('GET /api/me', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockCookie = undefined
    deletedCookies = []
    setSystemTime()
  })

  describe('성공', () => {
    test('인증된 사용자가 자신의 프로필 정보를 성공적으로 조회한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET()
      const contentType = response.headers.get('content-type')
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(contentType).toContain('application/json')
      expect(data).toEqual({
        id: 1,
        loginId: 'testuser1',
        nickname: 'Test User 1',
        imageURL: 'https://example.com/avatar1.jpg',
      })
      expect(deletedCookies).toEqual([])
    })

    test('프로필 이미지가 없는 사용자의 정보를 조회한다', async () => {
      // Given
      const token = await signJWT({ sub: '2', loginId: 'testuser2' }, TokenType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET()
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 2,
        loginId: 'testuser2',
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
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual([])
    })

    test('만료된 access token으로 요청하는 경우 401 응답을 반환한다', async () => {
      // Given
      const expiredToken = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: expiredToken }
      setSystemTime(new Date(Date.now() + 2 * 60 * 60 * 1000))

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('다른 키로 서명한 token으로 요청하는 경우 401 응답을 반환한다', async () => {
      // Given
      mock.module('@/constants/env', () => ({
        JWT_SECRET_ACCESS_TOKEN: 'different-secret-key-for-invalid-token',
        JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
      }))

      const invalidToken = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: invalidToken }

      mock.module('@/constants/env', () => ({
        JWT_SECRET_ACCESS_TOKEN: 'test-secret-access-token-for-testing',
        JWT_SECRET_REFRESH_TOKEN: 'test-secret-refresh-token-for-testing',
      }))

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('잘못된 형식의 access token으로 요청하는 경우 오류를 반환한다', async () => {
      // Given
      mockCookie = { value: 'invalid-token-format' }

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(deletedCookies).toEqual(['at'])
    })

    test('삭제된 사용자의 토큰으로 요청하는 경우 404 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '999', loginId: 'deleteduser' }, TokenType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET()
      const text = await response.text()

      // Then
      expect(response.status).toBe(404)
      expect(text).toBe('404 Not Found')
      expect(deletedCookies).toEqual(['at'])
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: token }

      // When
      const promises = Array.from({ length: 5 }, () => GET())
      const responses = await Promise.all(promises)
      const data = await Promise.all(responses.map((r) => r.json()))

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.id === 1 && d.loginId === 'testuser1')).toBe(true)
      expect(deletedCookies).toEqual([])
    })

    test('데이터베이스 연결 오류 시 적절한 오류 응답을 반환한다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: token }
      shouldThrowDatabaseError = true

      // When
      const request = async () => {
        await GET()
      }

      // Then
      expect(request).toThrow('Database connection failed')
    })
  })

  describe('보안', () => {
    test('다른 사용자의 정보에 접근할 수 없다', async () => {
      // Given
      const token = await signJWT({ sub: '1', loginId: 'testuser1' }, TokenType.ACCESS)
      mockCookie = { value: token }

      // When
      const response = await GET()
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
        const response = await GET()

        // Then
        expect(response.status).toBe(401)
        expect(deletedCookies).toEqual(['at'])
      }
    })
  })
})
