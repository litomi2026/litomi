import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { GET } from '../route'

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'access_token') {
        return mockCookie
      }
      return undefined
    },
    delete: mock(),
  }),
}))

let mockCookie: { value: string } | undefined
let currentUserId: string | null = null
let shouldThrowDatabaseError = false

mock.module('@/utils/cookie', () => ({
  getUserIdFromAccessToken: async (cookieStore: { get: (name: string) => { value: string } | undefined }) => {
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return null

    if (accessToken === 'valid-token-user-1') {
      currentUserId = '1'
      return '1'
    }
    if (accessToken === 'valid-token-user-2') {
      currentUserId = '2'
      return '2'
    }
    if (accessToken === 'valid-token-for-deleted-user') {
      currentUserId = '999'
      return '999'
    }
    if (accessToken === 'expired-token') {
      currentUserId = null
      return null
    }
    currentUserId = null
    return null
  },
}))

mock.module('@/utils/jwt', () => ({
  verifyJWT: async (token: string) => {
    if (token === 'valid-token-user-1') {
      return { sub: '1' }
    }
    if (token === 'valid-token-user-2') {
      return { sub: '2' }
    }
    if (token === 'valid-token-for-deleted-user') {
      return { sub: '999' }
    }
    if (token === 'expired-token') {
      throw new Error('Token has expired')
    }
    throw new Error('Invalid token')
  },
  TokenType: {
    ACCESS: 0,
    REFRESH: 1,
  },
}))

mock.module('@/database/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async () => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }
          if (currentUserId === '1') {
            return [
              {
                id: 1,
                loginId: 'testuser1',
                nickname: 'Test User 1',
                imageURL: 'https://example.com/avatar1.jpg',
              },
            ]
          }
          if (currentUserId === '2') {
            return [
              {
                id: 2,
                loginId: 'testuser2',
                nickname: 'Test User 2',
                imageURL: null,
              },
            ]
          }
          if (currentUserId === '999') {
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
    currentUserId = null
  })

  describe('성공', () => {
    test('인증된 사용자가 자신의 프로필 정보를 성공적으로 조회한다', async () => {
      // Given
      mockCookie = { value: 'valid-token-user-1' }

      // When
      const response = await GET()
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 1,
        loginId: 'testuser1',
        nickname: 'Test User 1',
        imageURL: 'https://example.com/avatar1.jpg',
      })
    })

    test('프로필 이미지가 없는 사용자의 정보를 조회한다', async () => {
      // Given
      mockCookie = { value: 'valid-token-user-2' }

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
    })
  })

  describe('인증 실패', () => {
    test('access_token 쿠키가 없는 경우 401 응답을 반환한다', async () => {
      // Given
      mockCookie = undefined

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(await response.text()).toBe('로그인 정보가 없거나 만료됐어요.')
    })

    test('만료된 access_token으로 요청하는 경우 401 응답을 반환한다', async () => {
      // Given
      mockCookie = { value: 'expired-token' }

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(401)
      expect(await response.text()).toBe('로그인 정보가 없거나 만료됐어요.')
    })

    test('잘못된 형식의 access_token으로 요청하는 경우 오류를 반환한다', async () => {
      // Given
      mockCookie = { value: 'invalid-token-format' }

      // When
      const response = await GET()

      // Then
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('사용자 없음', () => {
    test('삭제된 사용자의 토큰으로 요청하는 경우 404 응답을 반환한다', async () => {
      // Given
      mockCookie = { value: 'valid-token-for-deleted-user' }

      // When
      const response = await GET()

      // Then
      expect(response.status).toBe(404)
      const text = await response.text()
      expect(text).toBe('404 Not Found')

      // Note: 404 응답 시 access_token 쿠키가 자동으로 삭제됨
    })
  })

  describe('엣지 케이스', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // Given
      mockCookie = { value: 'valid-token-user-1' }

      // When - 5개의 동시 요청
      const promises = Array.from({ length: 5 }, () => GET())
      const responses = await Promise.all(promises)
      const data = await Promise.all(responses.map((r) => r.json()))

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.id === 1 && d.loginId === 'testuser1')).toBe(true)
    })

    test('데이터베이스 연결 오류 시 적절한 오류 응답을 반환한다', async () => {
      // Given
      mockCookie = { value: 'valid-token-user-1' }
      shouldThrowDatabaseError = true

      // When
      const request = async () => {
        await GET()
      }

      // Then
      expect(request).toThrow('Database connection failed')
    })
  })

  describe('보안 사례', () => {
    test('다른 사용자의 정보에 접근할 수 없다', async () => {
      // Given
      mockCookie = { value: 'valid-token-user-1' }

      // When
      const response = await GET()
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.id).toBe(1)
      expect(data.loginId).toBe('testuser1')
      expect(data.id).not.toBe(2)
      expect(data.loginId).not.toBe('testuser2')
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

        // When
        const response = await GET()

        // Then
        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(await response.text()).toBe('로그인 정보가 없거나 만료됐어요.')
      }
    })
  })
})
