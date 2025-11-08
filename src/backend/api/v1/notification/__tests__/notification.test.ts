import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import notificationRoutes, { type GETNotificationResponse } from '..'

const app = new Hono<Env>()
app.use('*', contextStorage())
app.route('/', notificationRoutes)

describe('GET /api/v1/notification', () => {
  const createRequest = (params?: string) => {
    const queryString = params ? `?${params}` : ''
    return app.request(`/${queryString}`)
  }

  describe('인증', () => {
    test('userId가 없으면 401 에러를 반환한다', async () => {
      const response = await createRequest()

      expect(response.status).toBe(401)
    })
  })

  describe('성공', () => {
    test.skip('파라미터 없이 요청하면 전체 알림을 반환한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest()
      const data = (await response.json()) as GETNotificationResponse

      expect(response.status).toBe(200)
      expect(data.notifications).toBeArray()
      expect(data.hasNextPage).toBeBoolean()
    })

    test.skip('nextId 파라미터로 페이지네이션이 작동한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest('nextId=100')
      const data = (await response.json()) as GETNotificationResponse

      expect(response.status).toBe(200)
      expect(data.notifications).toBeArray()
      expect(data.hasNextPage).toBeBoolean()
    })

    test.skip('filter=unread로 읽지 않은 알림만 필터링한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest('filter=unread')
      const data = (await response.json()) as GETNotificationResponse

      expect(response.status).toBe(200)
      expect(data.notifications).toBeArray()
    })

    test.skip('filter=new로 새 만화 알림만 필터링한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest('filter=new')
      const data = (await response.json()) as GETNotificationResponse

      expect(response.status).toBe(200)
      expect(data.notifications).toBeArray()
    })

    test.skip('여러 필터를 동시에 적용할 수 있다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest('filter=unread&filter=new')
      const data = (await response.json()) as GETNotificationResponse

      expect(response.status).toBe(200)
      expect(data.notifications).toBeArray()
    })
  })

  describe('실패', () => {
    test('유효하지 않은 nextId를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest('nextId=invalid')

      expect(response.status).toBe(400)
    })

    test('유효하지 않은 필터를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest('filter=invalid')

      expect(response.status).toBe(400)
    })
  })

  describe('캐시 헤더', () => {
    test.skip('응답에 private 캐시 헤더가 포함되어 있다', async () => {
      // 실제 인증이 필요한 테스트
      const response = await createRequest()

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })
})

describe('GET /api/v1/notification/unread-count', () => {
  describe('인증', () => {
    test('userId가 없으면 401 에러를 반환한다', async () => {
      const response = await app.request('/unread-count')

      expect(response.status).toBe(401)
    })
  })

  describe('성공', () => {
    test.skip('읽지 않은 알림 개수를 반환한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await app.request('/unread-count')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeNumber()
    })
  })

  describe('캐시 헤더', () => {
    test.skip('응답에 private 캐시 헤더가 포함되어 있다', async () => {
      // 실제 인증이 필요한 테스트
      const response = await app.request('/unread-count')

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=10')
    })
  })
})
