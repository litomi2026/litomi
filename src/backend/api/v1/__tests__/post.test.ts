import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import postRoutes, { type Post } from '../post'

let shouldThrowDatabaseError = false
const mockPosts: Post[] = []

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

const app = new Hono<TestEnv>()
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  if (c.env?.userId) {
    c.set('userId', c.env.userId)
  }
  await next()
})
app.route('/', postRoutes)

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

interface SelectPostsParams {
  currentUserId?: number
  cursor?: number
  filter?: string
  limit?: number
  mangaId?: number
  username?: string
}

mock.module('@/sql/selectPosts', () => ({
  default: async ({ limit, cursor, mangaId, filter, username }: SelectPostsParams) => {
    if (shouldThrowDatabaseError) {
      throw new Error('Database connection failed')
    }

    let filtered = [...mockPosts]

    if (mangaId) {
      filtered = filtered.filter((p) => p.mangaId === mangaId)
    }

    if (filter) {
      // Filter is a query param (e.g., FOLLOWING, MANGA), not a post property
      // In a real implementation, this would filter by type
      // For testing, we just pass through the filtered posts
    }

    if (username) {
      filtered = filtered.filter((p) => p.author?.name === username)
    }

    if (cursor) {
      filtered = filtered.filter((p) => p.id < cursor)
    }

    filtered.sort((a, b) => b.id - a.id)

    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    return filtered
  },
}))

describe('GET /api/v1/post', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockPosts.length = 0
  })

  describe('성공', () => {
    test('포스트 목록을 성공적으로 조회한다', async () => {
      // Given
      mockPosts.push(
        {
          id: 3,
          createdAt: new Date('2025-01-03'),
          content: 'Post 3',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          mangaId: null,
          likeCount: 10,
          commentCount: 5,
          repostCount: 2,
          referredPost: null,
        },
        {
          id: 2,
          createdAt: new Date('2025-01-02'),
          content: 'Post 2',
          author: { id: 2, name: 'user2', nickname: 'User Two', imageURL: null },
          mangaId: null,
          likeCount: 5,
          commentCount: 3,
          repostCount: 1,
          referredPost: null,
        },
        {
          id: 1,
          createdAt: new Date('2025-01-01'),
          content: 'Post 1',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
      )

      // When
      const response = await app.request('/')

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      expect(data.posts).toHaveLength(3)
      expect(data.posts[0].id).toBe(3)
      expect(data.posts[1].id).toBe(2)
      expect(data.posts[2].id).toBe(1)
      expect(data.nextCursor).toBeNull()
    })

    test('포스트가 없는 경우 빈 배열을 반환한다', async () => {
      // When
      const response = await app.request('/')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(0)
      expect(data.nextCursor).toBeNull()
    })

    test('limit을 지정하면 해당 개수만큼 반환하고 nextCursor를 포함한다', async () => {
      // Given
      for (let i = 5; i >= 1; i--) {
        mockPosts.push({
          id: i,
          createdAt: new Date(`2025-01-0${i}`),
          content: `Post ${i}`,
          author: null,
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        })
      }

      // When
      const response = await app.request('/?limit=3')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(3)
      expect(data.posts[0].id).toBe(5)
      expect(data.posts[1].id).toBe(4)
      expect(data.posts[2].id).toBe(3)
      expect(data.nextCursor).toBe(3)
    })

    test('cursor를 사용하여 페이지네이션이 동작한다', async () => {
      // Given
      for (let i = 5; i >= 1; i--) {
        mockPosts.push({
          id: i,
          createdAt: new Date(`2025-01-0${i}`),
          content: `Post ${i}`,
          author: null,
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        })
      }

      // When
      const response = await app.request('/?cursor=3')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(2)
      expect(data.posts[0].id).toBe(2)
      expect(data.posts[1].id).toBe(1)
      expect(data.nextCursor).toBeNull()
    })

    test('mangaId로 필터링이 동작한다', async () => {
      // Given
      mockPosts.push(
        {
          id: 1,
          mangaId: 100,
          createdAt: new Date(),
          content: 'Manga 100',
          author: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 2,
          mangaId: 200,
          createdAt: new Date(),
          content: 'Manga 200',
          author: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 3,
          mangaId: 100,
          createdAt: new Date(),
          content: 'Another Manga 100',
          author: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
      )

      // When
      const response = await app.request('/?mangaId=100')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(2)
      expect(data.posts.every((p: Post) => p.mangaId === 100)).toBe(true)
    })

    test('username으로 필터링이 동작한다', async () => {
      // Given
      mockPosts.push(
        {
          id: 1,
          createdAt: new Date(),
          content: 'Post by user1',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 2,
          createdAt: new Date(),
          content: 'Post by user2',
          author: { id: 2, name: 'user2', nickname: 'User Two', imageURL: null },
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 3,
          createdAt: new Date(),
          content: 'Another post by user1',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
      )

      // When
      const response = await app.request('/?username=user1')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(2)
      expect(data.posts.every((p: Post) => p.author?.name === 'user1')).toBe(true)
    })

    test('응답에 private Cache-Control 헤더가 포함되어 있다', async () => {
      // Given
      mockPosts.push({
        id: 1,
        createdAt: new Date(),
        content: 'Test',
        author: null,
        mangaId: null,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        referredPost: null,
      })

      // When
      const response = await app.request('/')

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })

  describe('실패', () => {
    test('유효하지 않은 cursor는 400 응답을 받는다', async () => {
      // When - 음수 cursor
      const negativeResponse = await app.request('/?cursor=-1')
      expect(negativeResponse.status).toBe(400)

      // When - 0 cursor
      const zeroResponse = await app.request('/?cursor=0')
      expect(zeroResponse.status).toBe(400)

      // When - 문자열 cursor
      const stringResponse = await app.request('/?cursor=abc')
      expect(stringResponse.status).toBe(400)
    })

    test('유효하지 않은 limit은 400 응답을 받는다', async () => {
      // When - 음수 limit
      const negativeResponse = await app.request('/?limit=-1')
      expect(negativeResponse.status).toBe(400)

      // When - 0
      const zeroResponse = await app.request('/?limit=0')
      expect(zeroResponse.status).toBe(400)

      // When - 100 초과
      const overResponse = await app.request('/?limit=101')
      expect(overResponse.status).toBe(400)

      // When - 문자열
      const stringResponse = await app.request('/?limit=abc')
      expect(stringResponse.status).toBe(400)
    })

    test('유효하지 않은 mangaId는 400 응답을 받는다', async () => {
      // When - 음수 mangaId
      const negativeResponse = await app.request('/?mangaId=-1')
      expect(negativeResponse.status).toBe(400)

      // When - 0
      const zeroResponse = await app.request('/?mangaId=0')
      expect(zeroResponse.status).toBe(400)

      // When - 문자열
      const stringResponse = await app.request('/?mangaId=abc')
      expect(stringResponse.status).toBe(400)
    })

    test('유효하지 않은 filter는 400 응답을 받는다', async () => {
      // When - 잘못된 filter
      const invalidResponse = await app.request('/?filter=4')
      expect(invalidResponse.status).toBe(400)

      // When - 문자열 filter
      const stringResponse = await app.request('/?filter=invalid')
      expect(stringResponse.status).toBe(400)
    })

    test('유효하지 않은 username은 400 응답을 받는다', async () => {
      // When - 빈 username
      const emptyResponse = await app.request('/?username=')
      expect(emptyResponse.status).toBe(400)

      // When - 33자 초과 username
      const longUsername = 'a'.repeat(33)
      const longResponse = await app.request(`/?username=${longUsername}`)
      expect(longResponse.status).toBe(400)
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // Given
      shouldThrowDatabaseError = true

      // When
      const response = await app.request('/')

      // Then
      expect(response.status).toBe(500)
    })
  })

  describe('기타', () => {
    test('limit과 cursor를 함께 사용하여 페이지네이션이 정상 동작한다', async () => {
      // Given
      for (let i = 10; i >= 1; i--) {
        mockPosts.push({
          id: i,
          createdAt: new Date(),
          content: `Post ${i}`,
          author: null,
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        })
      }

      // When
      const response = await app.request('/?cursor=8&limit=3')

      // Then
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.posts).toHaveLength(3)
      expect(data.posts[0].id).toBe(7)
      expect(data.posts[1].id).toBe(6)
      expect(data.posts[2].id).toBe(5)
      expect(data.nextCursor).toBe(5)
    })

    test('여러 필터를 동시에 사용할 수 있다', async () => {
      // Given
      mockPosts.push(
        {
          id: 1,
          mangaId: 100,
          createdAt: new Date(),
          content: 'Post 1',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 2,
          mangaId: 100,
          createdAt: new Date(),
          content: 'Post 2',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 3,
          mangaId: 200,
          createdAt: new Date(),
          content: 'Post 3',
          author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
        {
          id: 4,
          mangaId: 100,
          createdAt: new Date(),
          content: 'Post 4',
          author: { id: 2, name: 'user2', nickname: 'User Two', imageURL: null },
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        },
      )

      // Whdn
      const response = await app.request('/?mangaId=100&filter=1&username=user1')
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(2)
      expect(data.posts.every((p: Post) => p.mangaId === 100 && p.author?.name === 'user1')).toBe(true)
    })
  })
})
