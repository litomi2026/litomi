import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

import * as drizzleModule from '@/database/supabase/drizzle'

type HealthResponse = {
  status: 'ok'
  timestamp: string
}

type ReadyErrorResponse = {
  status: 'error'
  timestamp: string
  database?: undefined
}

type ReadyOkResponse = {
  status: 'ready'
  timestamp: string
  database: {
    checkedAt: string
    connected: boolean
  }
}

type ReadyResponse = ReadyErrorResponse | ReadyOkResponse

let shouldThrowDatabaseError = false
let shouldReportDatabaseDisconnected = false
let appRoutes: typeof import('../app').default
let checkDatabaseReadinessSpy: ReturnType<typeof spyOn>

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  checkDatabaseReadinessSpy = spyOn(drizzleModule, 'checkDatabaseReadiness').mockImplementation(() => {
    if (shouldThrowDatabaseError) {
      return Promise.reject(new Error('Database connection failed'))
    }

    if (shouldReportDatabaseDisconnected) {
      return Promise.resolve({
        checkedAt: new Date('2025-10-23T10:00:00Z'),
        connected: false,
      })
    }

    return Promise.resolve({
      checkedAt: new Date('2025-10-23T10:00:00Z'),
      connected: true,
    })
  })

  appRoutes = (await import('../app')).default
})

afterAll(() => {
  checkDatabaseReadinessSpy.mockRestore()
  mock.restore()
})

describe('GET /', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    shouldReportDatabaseDisconnected = false
  })

  test('쿼리 파라미터 없이 루트로 요청하면 404를 반환한다', async () => {
    const response = await appRoutes.request('/')
    expect(response.status).toBe(404)
  })

  test('쿼리 파라미터를 포함해도 루트로 요청하면 404를 반환한다', async () => {
    const response = await appRoutes.request('/?name=홍길동&age=25')
    expect(response.status).toBe(404)
  })

  test('동일한 루트 요청을 여러 번 보내도 일관되게 404를 반환한다', async () => {
    const promises = Array.from({ length: 5 }, () => appRoutes.request('/?name=테스트&age=20'))
    const responses = await Promise.all(promises)

    expect(responses.every((r) => r.status === 404)).toBe(true)
  })
})

describe('GET /health', () => {
  test('헬스체크 요청 시 정상 상태를 반환한다', async () => {
    const response = await appRoutes.request('/health')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')

    const data = (await response.json()) as HealthResponse
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })

  test('여러 번 요청하는 경우 매번 정상 상태를 반환한다', async () => {
    const promises = Array.from({ length: 10 }, () => appRoutes.request('/health'))
    const responses = await Promise.all(promises)
    expect(responses.every((r) => r.status === 200)).toBe(true)

    const data = (await Promise.all(responses.map((r) => r.json()))) as HealthResponse[]
    expect(data.every((d) => d.status === 'ok' && d.timestamp)).toBe(true)
  })

  test('응답에 타임스탬프가 포함되어 있다', async () => {
    const response = await appRoutes.request('/health')
    const data = (await response.json()) as HealthResponse
    expect(data.timestamp).toBeDefined()

    const timestamp = new Date(data.timestamp)
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000)
  })
})

describe('GET /ready', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    shouldReportDatabaseDisconnected = false
  })

  describe('성공', () => {
    test('데이터베이스 연결이 정상인 경우 준비 상태를 반환한다', async () => {
      const response = await appRoutes.request('/ready')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = (await response.json()) as ReadyOkResponse
      expect(data.status).toBe('ready')
      expect(data.database).toBeDefined()
      expect(data.database.connected).toBe(true)
      expect(data.database.checkedAt).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    test('데이터베이스 상태가 올바르게 반환된다', async () => {
      // 실행
      const response = await appRoutes.request('/ready')
      const data = (await response.json()) as ReadyOkResponse

      // 검증
      expect(data.status).toBe('ready')
      expect(data.database.connected).toBe(true)
      expect(new Date(data.database.checkedAt)).toBeInstanceOf(Date)
    })

    test('여러 번 요청하는 경우 일관된 준비 상태를 반환한다', async () => {
      const promises = Array.from({ length: 5 }, () => appRoutes.request('/ready'))
      const responses = await Promise.all(promises)
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = (await Promise.all(responses.map((r) => r.json()))) as ReadyOkResponse[]
      expect(data.every((d) => d.status === 'ready' && d.database.connected === true)).toBe(true)
    })
  })

  describe('실패', () => {
    test('데이터베이스 연결 오류 시 503 응답을 반환한다', async () => {
      shouldThrowDatabaseError = true
      const response = await appRoutes.request('/ready')
      expect(response.status).toBe(503)

      const data = (await response.json()) as ReadyErrorResponse
      expect(data.status).toBe('error')
      expect(data.timestamp).toBeDefined()
      expect(data.database).toBeUndefined()
    })

    test('데이터베이스 연결 상태가 false인 경우 503 응답을 반환한다', async () => {
      shouldReportDatabaseDisconnected = true
      const response = await appRoutes.request('/ready')
      expect(response.status).toBe(503)

      const data = (await response.json()) as ReadyErrorResponse
      expect(data.status).toBe('error')
      expect(data.timestamp).toBeDefined()
      expect(data.database).toBeUndefined()
    })
  })

  describe('기타', () => {
    test('데이터베이스 오류 후 복구되는 경우 정상 상태를 반환한다', async () => {
      // 준비 - 첫 번째 요청은 실패
      shouldThrowDatabaseError = true
      const errorResponse = await appRoutes.request('/ready')
      expect(errorResponse.status).toBe(503)

      // 실행 - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      const successResponse = await appRoutes.request('/ready')

      // 검증
      expect(successResponse.status).toBe(200)

      const data = (await successResponse.json()) as ReadyOkResponse
      expect(data.status).toBe('ready')
      expect(data.database.connected).toBe(true)
    })

    test('준비 상태 응답에 타임스탬프가 포함되어 있다', async () => {
      const response = await appRoutes.request('/ready')
      const data = (await response.json()) as ReadyResponse
      expect(data.timestamp).toBeDefined()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000)
    })
  })
})
