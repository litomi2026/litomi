import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { GETV1PostLikedResponse } from '@/backend/api/v1/post/liked'
import type { ReferredPost } from '@/components/post/ReferredPostCard'

import { PostFilter } from '@/backend/api/v1/post/constant'
import { encodePostCursor } from '@/common/cursor'
import { PostType } from '@/database/enum'

import type { Post as ApiPost, GETV1PostResponse } from '..'

type PostRouteModule = typeof import('..')
type SelectPostsParams = {
  currentUserId?: number
  cursorCreatedAt?: Date
  cursorId?: number
  filter?: string
  limit?: number
  mangaId?: number
  postId?: number
  username?: string
}

type StoredPost = {
  content: string
  id: number
  mangaId: number | null
  parentPostId: number | null
  referredPostId: number | null
  type: PostType
  userId: number
}

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

let postRoutes: PostRouteModule['default']
let app: Hono<TestEnv>
let shouldThrowDatabaseError = false
let nextPostId = 1

const dialect = new PgDialect()
const mockPosts: ApiPost[] = []
const likedPostIdsByUser = new Map<number, number[]>()
const storedPosts: StoredPost[] = []

function createGetPost(overrides: Partial<ApiPost> = {}): ApiPost {
  return {
    id: 1,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    content: 'Post 1',
    type: PostType.TEXT,
    author: { id: 1, name: 'user1', nickname: 'User One', imageURL: null },
    mangaId: null,
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    referredPost: null,
    ...overrides,
  }
}

function createPostgresForeignKeyError() {
  return new Error('Foreign key violation', {
    cause: {
      code: '23503',
      constraint_name: 'post_parent_post_id_fkey',
    },
  })
}

function extractPostLikeWhereParams(condition: unknown): Record<string, number> {
  const params: Record<string, number> = {}
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

  for (const match of sql.matchAll(/"post_like"\."([^"]+)" = \$(\d+)/g)) {
    const [, columnName, paramIndex] = match
    const value = queryParams[Number(paramIndex) - 1]

    if (typeof value === 'number') {
      params[columnName] = value
    }
  }

  return params
}

function extractWhereParams(condition: unknown): Record<string, number> {
  const params: Record<string, number> = {}
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

  for (const match of sql.matchAll(/"post"\."([^"]+)" = \$(\d+)/g)) {
    const [, columnName, paramIndex] = match
    const value = queryParams[Number(paramIndex) - 1]

    if (typeof value === 'number') {
      params[columnName] = value
    }
  }

  return params
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async (condition: unknown) => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }

          const { user_id: userId } = extractPostLikeWhereParams(condition)

          return (likedPostIdsByUser.get(userId) ?? []).map((postId) => ({ postId }))
        },
      }),
    }),
    delete: () => ({
      where: (condition: unknown) => ({
        returning: async () => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }

          const { id, user_id: userId } = extractWhereParams(condition)
          const targetIndex = storedPosts.findIndex((post) => post.id === id && post.userId === userId)

          if (targetIndex === -1) {
            return []
          }

          const [deletedPost] = storedPosts.splice(targetIndex, 1)

          for (const post of storedPosts) {
            if (post.parentPostId === deletedPost?.id) {
              post.parentPostId = null
            }

            if (post.referredPostId === deletedPost?.id) {
              post.referredPostId = null
            }
          }

          return [{ id }]
        },
      }),
    }),
    insert: () => ({
      values: (values: Omit<StoredPost, 'id'>) => ({
        returning: async () => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }

          if (values.parentPostId && !storedPosts.some((post) => post.id === values.parentPostId)) {
            throw createPostgresForeignKeyError()
          }

          if (values.referredPostId && !storedPosts.some((post) => post.id === values.referredPostId)) {
            throw createPostgresForeignKeyError()
          }

          const createdPost = {
            id: nextPostId++,
            ...values,
          }

          storedPosts.push(createdPost)

          return [{ id: createdPost.id }]
        },
      }),
    }),
  },
}))

mock.module('@/sql/selectPost', () => ({
  default: async ({ limit, cursorCreatedAt, cursorId, mangaId, postId, username }: SelectPostsParams) => {
    if (shouldThrowDatabaseError) {
      throw new Error('Database connection failed')
    }

    let filtered = [...mockPosts]

    if (mangaId) {
      filtered = filtered.filter((post) => post.mangaId === mangaId)
    }

    if (postId) {
      filtered = filtered.filter((post) => post.id === postId)
    }

    if (username) {
      filtered = filtered.filter((post) => post.author?.name === username)
    }

    if (cursorCreatedAt && cursorId) {
      filtered = filtered.filter(
        (post) =>
          post.createdAt.getTime() < cursorCreatedAt.getTime() ||
          (post.createdAt.getTime() === cursorCreatedAt.getTime() && post.id < cursorId),
      )
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)

    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    return filtered
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  postRoutes = (await import('..')).default

  app = new Hono<TestEnv>()
  app.use('*', contextStorage())
  app.use('*', async (c, next) => {
    const userId = c.env?.userId

    if (typeof userId === 'number') {
      c.set('userId', userId)
    }

    await next()
  })
  app.route('/', postRoutes)
})

beforeEach(() => {
  shouldThrowDatabaseError = false
  nextPostId = 1
  mockPosts.length = 0
  likedPostIdsByUser.clear()
  storedPosts.length = 0
})

describe('GET /api/v1/post', () => {
  test('포스트 목록을 성공적으로 조회한다', async () => {
    mockPosts.push(
      createGetPost({
        id: 3,
        createdAt: new Date('2025-01-03T00:00:00.000Z'),
        content: 'Post 3',
        likeCount: 10,
        commentCount: 5,
        repostCount: 2,
      }),
      createGetPost({
        id: 2,
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        content: 'Post 2',
        author: { id: 2, name: 'user2', nickname: 'User Two', imageURL: null },
        likeCount: 5,
        commentCount: 3,
        repostCount: 1,
      }),
      createGetPost(),
    )

    const response = await app.request('/')

    expect(response.status).toBe(200)
    const data = (await response.json()) as GETV1PostResponse
    expect(data.posts).toHaveLength(3)
    expect(data.posts[0]).not.toHaveProperty('isLiked')
    expect(data.posts[0]?.type).toBe(PostType.TEXT)
    expect(data.nextCursor).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3, s-maxage=300, stale-while-revalidate=30')
  })

  test('리포스트 원글이 삭제되면 tombstone referred post를 반환한다', async () => {
    mockPosts.push(
      createGetPost({
        id: 10,
        type: PostType.REPOST,
        referredPost: { isDeleted: true } satisfies ReferredPost,
      }),
    )

    const response = await app.request('/')

    expect(response.status).toBe(200)
    const data = (await response.json()) as GETV1PostResponse
    expect(data.posts[0]?.referredPost).toEqual({ isDeleted: true })
  })

  test('유효하지 않은 limit은 400 응답을 받는다', async () => {
    const response = await app.request('/?limit=999')
    expect(response.status).toBe(400)
  })

  test('유효하지 않은 cursor는 400 응답을 받는다', async () => {
    const response = await app.request('/?cursor=invalid-cursor')

    expect(response.status).toBe(400)
  })

  test('cursor가 있는 비개인화 목록은 public cache-control을 반환한다', async () => {
    mockPosts.push(createGetPost({ id: 3, createdAt: new Date('2025-01-03T00:00:00.000Z') }))

    const response = await app.request(`/?filter=${PostFilter.RECOMMEND}&cursor=${encodePostCursor(Date.parse('2025-01-03T00:00:00.000Z'), 3)}`)

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
    )
  })

  test('FOLLOWING 목록은 private cache-control을 반환한다', async () => {
    const response = await app.request(`/?filter=${PostFilter.FOLLOWING}`, {}, { userId: 1 })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3')
  })
})

describe('GET /api/v1/post/liked', () => {
  test('인증된 사용자의 좋아요한 글 ID 목록을 반환한다', async () => {
    likedPostIdsByUser.set(1, [9, 3, 1])

    const response = await app.request('/liked', {}, { userId: 1 })

    expect(response.status).toBe(200)
    const data = (await response.json()) as GETV1PostLikedResponse
    expect(data).toEqual({ postIds: [9, 3, 1] })
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=86400')
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/liked')

    expect(response.status).toBe(401)
  })
})

describe('POST /api/v1/post', () => {
  test('일반 글을 생성하면 TEXT 타입으로 저장한다', async () => {
    const response = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hello world' }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(201)
    expect(storedPosts[0]).toEqual(
      expect.objectContaining({
        type: PostType.TEXT,
        parentPostId: null,
        referredPostId: null,
      }),
    )
  })

  test('답글을 생성하면 REPLY 타입으로 저장한다', async () => {
    storedPosts.push({
      id: 10,
      userId: 2,
      content: 'parent',
      mangaId: null,
      parentPostId: null,
      referredPostId: null,
      type: PostType.TEXT,
    })
    nextPostId = 11

    const response = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'reply post', parentPostId: 10 }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(201)
    expect(storedPosts.at(-1)).toEqual(
      expect.objectContaining({
        type: PostType.REPLY,
        parentPostId: 10,
      }),
    )
  })

  test('리포스트를 생성하면 REPOST 타입으로 저장한다', async () => {
    storedPosts.push({
      id: 10,
      userId: 2,
      content: 'parent',
      mangaId: null,
      parentPostId: null,
      referredPostId: null,
      type: PostType.TEXT,
    })
    nextPostId = 11

    const response = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'repost post', referredPostId: 10 }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(201)
    expect(storedPosts.at(-1)).toEqual(
      expect.objectContaining({
        type: PostType.REPOST,
        referredPostId: 10,
      }),
    )
  })

  test('답글과 리포스트를 동시에 지정하면 400 응답을 반환한다', async () => {
    const response = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hello world', parentPostId: 1, referredPostId: 2 }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
  })

  test('없는 글을 참조하면 404 응답을 반환한다', async () => {
    const response = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'reply post', parentPostId: 999 }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/v1/post/:id', () => {
  test('원글을 삭제하면 row가 제거되고 child reference는 null로 바뀐다', async () => {
    storedPosts.push(
      {
        id: 1,
        userId: 1,
        content: 'root',
        mangaId: null,
        parentPostId: null,
        referredPostId: null,
        type: PostType.TEXT,
      },
      {
        id: 2,
        userId: 2,
        content: 'reply',
        mangaId: null,
        parentPostId: 1,
        referredPostId: null,
        type: PostType.REPLY,
      },
      {
        id: 3,
        userId: 3,
        content: 'repost',
        mangaId: null,
        parentPostId: null,
        referredPostId: 1,
        type: PostType.REPOST,
      },
    )
    nextPostId = 4

    const response = await app.request('/1', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(204)
    expect(storedPosts.find((post) => post.id === 1)).toBeUndefined()
    expect(storedPosts.find((post) => post.id === 2)?.parentPostId).toBeNull()
    expect(storedPosts.find((post) => post.id === 3)?.referredPostId).toBeNull()
    expect(storedPosts).toHaveLength(2)
  })

  test('남의 글은 삭제할 수 없다', async () => {
    storedPosts.push({
      id: 1,
      userId: 2,
      content: 'root',
      mangaId: null,
      parentPostId: null,
      referredPostId: null,
      type: PostType.TEXT,
    })

    const response = await app.request('/1', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(404)
    expect(storedPosts).toHaveLength(1)
  })
})

describe('POST /api/v1/post/:id/like', () => {
  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/1/like', { method: 'POST' })
    expect(response.status).toBe(401)
  })

  test('유효하지 않은 post id는 400 응답을 받는다', async () => {
    const response = await app.request('/invalid/like', { method: 'POST' }, { userId: 1 })
    expect(response.status).toBe(400)
  })
})
