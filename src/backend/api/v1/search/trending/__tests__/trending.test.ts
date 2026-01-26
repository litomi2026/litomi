import { describe, expect, mock, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { TrendingKeyword } from '@/services/TrendingKeywordsService'

import { type GETTrendingKeywordsResponse } from '../GET'
import trendingRoutes from '../index'
import trendingPostRoutes, { type POSTV1SearchTrendingResponse } from '../POST'

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
  { keyword: '-male:big_ass', score: 100 },
  { keyword: 'blue archive -male:big_ass', score: 80 },
  { keyword: 'male:big_ass', score: 60 },
]

const trackSearchMock = mock(() => Promise.resolve())

mock.module('@/services/TrendingKeywordsService', () => ({
  trendingKeywordsService: {
    getTrendingHourly: mock(async (limit: number) => {
      return mockKeywords.slice(0, limit)
    }),
    getTrendingDaily: mock(async (limit: number) => {
      return mockKeywords.slice(0, limit)
    }),
    trackSearch: trackSearchMock,
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
    test('type 파라미터 없이 요청하면 기본값 hourly를 사용한다', async () => {
      const response = await createRequest()
      const data = (await response.json()) as GETTrendingKeywordsResponse

      expect(response.status).toBe(200)
      expect(data.keywords).toBeArray()
      expect(data.updatedAt).toBeDefined()
    })

    test('type=hourly로 요청하면 시간별 트렌딩을 반환한다', async () => {
      const response = await createRequest('hourly')
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

    test('제외 토큰(-category:value)은 -를 유지하고 번역된 라벨로 표시한다', async () => {
      const response = await createRequest('hourly')
      const data = (await response.json()) as GETTrendingKeywordsResponse

      const excluded = data.keywords.find((k) => k.value === '-male:big_ass')
      expect(excluded?.label).toBe('-남:큰 엉덩이')
    })

    test('일반 단어 + 제외 토큰이 섞인 검색어는 일반 단어는 묶고, 필터는 번역해서 표시한다', async () => {
      const response = await createRequest('hourly')
      const data = (await response.json()) as GETTrendingKeywordsResponse

      const mixed = data.keywords.find((k) => k.value === 'blue archive -male:big_ass')
      expect(mixed?.label).toBe('blue archive, -남:큰 엉덩이')
    })
  })

  describe('실패', () => {
    test('유효하지 않은 type을 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest('invalid')

      expect(response.status).toBe(400)
    })
  })

  describe('캐시 헤더', () => {
    test('hourly 응답에 1시간 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('hourly')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    })

    test('daily 응답에 1일 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('daily')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('s-maxage=86400')
    })

    test('weekly 응답에 1주 캐시 헤더가 포함되어 있다', async () => {
      const response = await createRequest('weekly')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('public')
      expect(response.headers.get('cache-control')).toContain('s-maxage=604800')
    })
  })

  describe('동시 요청', () => {
    test('동시에 여러 type의 요청을 처리할 수 있다', async () => {
      const types = ['hourly', 'daily', 'weekly']
      const promises = types.map((type) => createRequest(type))
      const responses = await Promise.all(promises)
      const data = (await Promise.all(responses.map((r) => r.json()))) as GETTrendingKeywordsResponse[]

      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.keywords && d.updatedAt)).toBe(true)
    })
  })
})

describe('POST /api/v1/search/trending', () => {
  const app = new Hono<Env>().use(contextStorage()).route('/', trendingPostRoutes)

  describe('성공', () => {
    test('단일 키워드를 추적할 수 있다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: ['test keyword'] }),
      })
      const data = (await res.json()) as POSTV1SearchTrendingResponse

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tracked).toBe(1)
    })

    test('여러 키워드를 한번에 추적할 수 있다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: ['keyword1', 'keyword2', 'keyword3'] }),
      })
      const data = (await res.json()) as POSTV1SearchTrendingResponse

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tracked).toBe(3)
    })
  })

  describe('실패', () => {
    test('keywords가 빈 배열이면 400 에러를 반환한다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: [] }),
      })

      expect(res.status).toBe(400)
    })

    test('keywords가 없으면 400 에러를 반환한다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
    })

    test('keywords가 10개를 초과하면 400 에러를 반환한다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: Array.from({ length: 11 }, (_, i) => `keyword${i}`),
        }),
      })

      expect(res.status).toBe(400)
    })

    test('keyword가 100자를 초과하면 400 에러를 반환한다', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: ['a'.repeat(101)],
        }),
      })

      expect(res.status).toBe(400)
    })
  })
})
