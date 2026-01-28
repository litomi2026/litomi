import { beforeEach, describe, expect, mock, test } from 'bun:test'

import appRoutes from '../app'

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
    connected: boolean
    time: string
    version: string
  }
}

type ReadyResponse = ReadyErrorResponse | ReadyOkResponse

type RootResponse = {
  name?: string
  age?: number
}

let shouldThrowDatabaseError = false
let shouldReturnEmptyResult = false

mock.module('hono/timing', () => ({
  startTime: () => {},
  endTime: () => {},
  setMetric: () => {},
  timing: () => {},
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    execute: () => {
      if (shouldThrowDatabaseError) {
        return Promise.reject(new Error('Database connection failed'))
      }

      if (shouldReturnEmptyResult) {
        return Promise.resolve([])
      }

      return Promise.resolve([
        {
          current_time: new Date('2025-10-23T10:00:00Z'),
          version: 'PostgreSQL 15.0',
          connection: 1,
        },
      ])
    },
  },
}))

describe('GET /', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    shouldReturnEmptyResult = false
  })

  describe('성공', () => {
    test('쿼리 파라미터 없이 요청하는 경우 기본 응답을 반환한다', async () => {
      const response = await appRoutes.request('/')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = (await response.json()) as RootResponse
      expect(data.name).toBeUndefined()
      expect(data.age).toBeUndefined()
    })

    test('name 쿼리 파라미터를 포함하여 요청하는 경우 name을 반환한다', async () => {
      const response = await appRoutes.request('/?name=홍길동')
      expect(response.status).toBe(200)

      const data = (await response.json()) as RootResponse
      expect(data.name).toBe('홍길동')
      expect(data.age).toBeUndefined()
    })

    test('age 쿼리 파라미터를 포함하여 요청하는 경우 숫자로 변환하여 반환한다', async () => {
      const response = await appRoutes.request('/?age=25')
      expect(response.status).toBe(200)

      const data = (await response.json()) as RootResponse
      expect(data.name).toBeUndefined()
      expect(data.age).toBe(25)
    })

    test('name과 age 모두 포함하여 요청하는 경우 두 값을 반환한다', async () => {
      const response = await appRoutes.request('/?name=김철수&age=30')
      expect(response.status).toBe(200)

      const data = (await response.json()) as RootResponse
      expect(data.name).toBe('김철수')
      expect(data.age).toBe(30)
    })
  })

  describe('실패', () => {
    test('age 파라미터가 숫자로 변환될 수 없는 경우 400 응답을 반환한다', async () => {
      const response = await appRoutes.request('/?age=invalid')
      expect(response.status).toBe(400)
    })

    test('age 파라미터가 음수인 경우 정상적으로 처리한다', async () => {
      const response = await appRoutes.request('/?age=-5')
      expect(response.status).toBe(200)

      const data = (await response.json()) as RootResponse
      expect(data.age).toBe(-5)
    })
  })

  describe('기타', () => {
    test('동일한 파라미터로 여러 번 요청하는 경우 일관된 응답을 반환한다', async () => {
      // When
      const promises = Array.from({ length: 5 }, () => appRoutes.request('/?name=테스트&age=20'))
      const responses = await Promise.all(promises)
      const data = (await Promise.all(responses.map((r) => r.json()))) as RootResponse[]

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)
      expect(data.every((d) => d.name === '테스트' && d.age === 20)).toBe(true)
    })

    test('특수 문자가 포함된 name을 올바르게 처리한다', async () => {
      const response = await appRoutes.request('/?name=John%20Doe&age=25')
      expect(response.status).toBe(200)

      const data = (await response.json()) as RootResponse
      expect(data.name).toBe('John Doe')
      expect(data.age).toBe(25)
    })
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
    shouldReturnEmptyResult = false
  })

  describe('성공', () => {
    test('데이터베이스 연결이 정상인 경우 ready 상태를 반환한다', async () => {
      const response = await appRoutes.request('/ready')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = (await response.json()) as ReadyOkResponse
      expect(data.status).toBe('ready')
      expect(data.database).toBeDefined()
      expect(data.database.connected).toBe(true)
      expect(data.database.time).toBeDefined()
      expect(data.database.version).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    test('데이터베이스 정보가 올바르게 반환된다', async () => {
      // When
      const response = await appRoutes.request('/ready')
      const data = (await response.json()) as ReadyOkResponse

      // Then
      expect(data.status).toBe('ready')
      expect(data.database.connected).toBe(true)
      expect(data.database.version).toContain('PostgreSQL')
      expect(new Date(data.database.time)).toBeInstanceOf(Date)
    })

    test('여러 번 요청하는 경우 일관된 ready 상태를 반환한다', async () => {
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

    test('데이터베이스 쿼리 결과가 비어있는 경우 503 응답을 반환한다', async () => {
      shouldReturnEmptyResult = true
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
      // Given - 첫 번째 요청은 실패
      shouldThrowDatabaseError = true
      const errorResponse = await appRoutes.request('/ready')
      expect(errorResponse.status).toBe(503)

      // When - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      const successResponse = await appRoutes.request('/ready')

      // Then
      expect(successResponse.status).toBe(200)

      const data = (await successResponse.json()) as ReadyOkResponse
      expect(data.status).toBe('ready')
      expect(data.database.connected).toBe(true)
    })

    test('ready 응답에 타임스탬프가 포함되어 있다', async () => {
      const response = await appRoutes.request('/ready')
      const data = (await response.json()) as ReadyResponse
      expect(data.timestamp).toBeDefined()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000)
    })
  })
})
