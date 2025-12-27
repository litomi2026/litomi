import { describe, expect, it } from 'bun:test'
import { HTTPException } from 'hono/http-exception'

import { env } from '@/env/server.hono'

import realtimeRoutes from '../realtime'

const { GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL, GA_SERVICE_ACCOUNT_KEY } = env

describe('GET /api/v1/analytics/realtime', () => {
  describe('환경 변수 확인', () => {
    it('환경 변수가 없으면 503 에러를 반환한다', async () => {
      if (!GA_SERVICE_ACCOUNT_EMAIL || !GA_SERVICE_ACCOUNT_KEY || !GA_PROPERTY_ID) {
        const req = new Request('http://localhost/api/v1/analytics/realtime')

        try {
          await realtimeRoutes.fetch(req)
        } catch (error) {
          expect(error).toBeInstanceOf(HTTPException)
          if (error instanceof HTTPException) {
            expect(error.status).toBe(503)
            expect(error.message).toBe('Service Unavailable')
          }
        }
      }
    })
  })
})
