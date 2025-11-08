import { describe, expect, mock, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { TrendingKeyword } from '@/services/TrendingKeywordsService'

import trendingRoutes, { type GETTrendingKeywordsResponse } from '..'

mock.module('@/database/redis', () => ({
  redisClient: {
    multi: () => ({
      get: mock(() => Promise.resolve(null)),
      set: mock(() => Promise.resolve()),
      exec: mock(() => Promise.resolve()),
    }),
    get: mock(() => Promise.resolve(null)),
    set: mock(() => Promise.resolve()),
    del: mock(() => Promise.resolve()),
    keys: mock(() => Promise.resolve([])),
  },
}))

mock.module('@upstash/redis', () => ({
  Redis: class MockRedis {
    del = mock(() => Promise.resolve(0))
    get = mock(() => Promise.resolve(null))
    keys = mock(() => Promise.resolve([]))
    set = mock(() => Promise.resolve('OK'))
    constructor() {
      // Silent initialization
    }
    multi = () => ({
      get: mock(() => this),
      set: mock(() => this),
      exec: mock(() => Promise.resolve([])),
    })
  },
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          groupBy: mock(() => ({
            orderBy: mock(() => ({
              limit: mock(() => Promise.resolve([])),
            })),
          })),
        })),
      })),
    })),
    delete: mock(() => ({
      where: mock(() => Promise.resolve()),
    })),
  },
}))

const mockKeywords: TrendingKeyword[] = [
  { keyword: 'test1', score: 100 },
  { keyword: 'test2', score: 80 },
  { keyword: 'test3', score: 60 },
]

mock.module('@/services/TrendingKeywordsService', () => ({
  trendingKeywordsService: {
    getTrendingRealtime: mock(async (limit: number) => {
      return mockKeywords.slice(0, limit)
    }),
    getTrendingDaily: mock(async (limit: number) => {
      return mockKeywords.slice(0, limit)
    }),
    getTrendingHistorical: mock(async (_: number, limit: number) => {
      return mockKeywords.slice(0, limit)
    }),
  },
  TrendingKeyword: {},
}))

const app = new Hono<Env>()
app.use('*', contextStorage())
app.route('/', trendingRoutes)

describe('GET /api/v1/search/trending', () => {
  const createRequest = (type?: string) => {
    const params = type ? `?type=${encodeURIComponent(type)}` : ''
    return app.request(`/${params}`)
  }

  describe('성공', () => {
    test('type 파라미터 없이 요청하면 기본값 realtime을 사용한다', async () => {
      const response = await createRequest()
      const data = (await response.json()) as GETTrendingKeywordsResponse

      expect(response.status).toBe(200)
      expect(data.keywords).toBeArray()
      expect(data.updatedAt).toBeDefined()
    })

    test('type=realtime으로 요청하면 실시간 트렌딩을 반환한다', async () => {
      const response = await createRequest('realtime')
      const data = (await response.json()) as GETTrendingKeywordsResponse

      expect(response.status).toBe(200)
      expect(data.keywords).toBeArray()
      expect(data.keywords.length).toBeLessThanOrEqual(10)
    })

    test('type=daily로 요청하면 일일 트렌딩을 반환한다', async () => {
      const response = await createRequest('daily')
      const data = (await response.json()) as GETTrendingKeywordsResponse

      expect(response.status).toBe(200)
      expect(data.keywords).toBeArray()
      expect(data.keywords.length).toBeLessThanOrEqual(10)
    })

    test('type=weekly로 요청하면 주간 트렌딩을 반환한다', async () => {
      const response = await createRequest('weekly')
      const data = (await response.json()) as GETTrendingKeywordsResponse

      expect(response.status).toBe(200)
      expect(data.keywords).toBeArray()
      expect(data.keywords.length).toBeLessThanOrEqual(10)
    })
  })

  describe('실패', () => {
    test('유효하지 않은 type을 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest('invalid')

      expect(response.status).toBe(400)
    })
  })

  describe('캐시 헤더', () => {
    test('realtime 응답에 10분 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('realtime')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('max-age=600')
    })

    test('daily 응답에 1시간 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('daily')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('max-age=3600')
    })

    test('weekly 응답에 1일 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('weekly')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('max-age=86400')
    })
  })

  describe('동시 요청', () => {
    test('동시에 여러 type의 요청을 처리할 수 있다', async () => {
      const types = ['realtime', 'daily', 'weekly']
      const promises = types.map((type) => createRequest(type))
      const responses = await Promise.all(promises)
      const data = await Promise.all(responses.map((r) => r.json()))

      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.keywords && d.updatedAt)).toBe(true)
    })
  })
})
