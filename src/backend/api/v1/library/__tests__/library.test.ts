import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import libraryRoutes from '..'
import { type GETLibraryItemsResponse } from '../[id]'
import { type GETLibraryResponse } from '../GET'

const app = new Hono<Env>()
app.use('*', contextStorage())
app.route('/', libraryRoutes)

describe('GET /api/v1/library', () => {
  describe('인증', () => {
    test('userId가 없으면 401 에러를 반환한다', async () => {
      const response = await app.request('/')

      expect(response.status).toBe(401)
    })
  })

  describe('성공', () => {
    test.skip('사용자의 라이브러리 목록을 반환한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await app.request('/')
      const data = (await response.json()) as GETLibraryResponse

      expect(response.status).toBe(200)
      expect(data).toBeArray()
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id')
        expect(data[0]).toHaveProperty('name')
        expect(data[0]).toHaveProperty('color')
        expect(data[0]).toHaveProperty('icon')
        expect(data[0]).toHaveProperty('itemCount')
      }
    })
  })
})

describe('GET /api/v1/library/list', () => {
  const createRequest = (cursor?: string) => {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return app.request(`/list${params}`)
  }

  test('유효하지 않은 cursor를 사용하면 400 에러를 반환한다', async () => {
    const response = await createRequest('invalid-cursor')

    expect(response.status).toBe(400)
  })
})

describe('GET /api/v1/library/manga', () => {
  const createRequest = (cursor?: string) => {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return app.request(`/manga${params}`)
  }

  test('유효하지 않은 cursor를 사용하면 400 에러를 반환한다', async () => {
    const response = await createRequest('invalid-cursor')

    expect(response.status).toBe(400)
  })
})

describe('GET /api/v1/library/summary', () => {
  test('userId가 없으면 401 에러를 반환한다', async () => {
    const response = await app.request('/summary')

    expect(response.status).toBe(401)
  })
})

describe('GET /api/v1/library/:id/meta', () => {
  const createRequest = (libraryId: number | string) => {
    return app.request(`/${libraryId}/meta`)
  }

  test('유효하지 않은 libraryId를 사용하면 400 에러를 반환한다', async () => {
    const response = await createRequest('invalid')

    expect(response.status).toBe(400)
  })
})

describe('GET /api/v1/library/:id', () => {
  const createRequest = (libraryId: number | string, cursor?: string) => {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return app.request(`/${libraryId}${params}`)
  }

  describe('파라미터 검증', () => {
    test('유효하지 않은 libraryId를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest('invalid')

      expect(response.status).toBe(400)
    })

    test('음수 libraryId를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest(-1)

      expect(response.status).toBe(400)
    })

    test('0 libraryId를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest(0)

      expect(response.status).toBe(400)
    })
  })

  describe('권한 검증', () => {
    test.skip('존재하지 않는 라이브러리를 요청하면 404 에러를 반환한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest(999999)

      expect(response.status).toBe(404)
    })

    test.skip('비공개 라이브러리를 다른 사용자가 요청하면 404 에러를 반환한다', async () => {
      // 실제 인증 및 DB 연결이 필요한 테스트
      const response = await createRequest(1)

      expect(response.status).toBe(404)
    })
  })

  describe('성공', () => {
    test.skip('라이브러리 아이템을 반환한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest(1)
      const data = (await response.json()) as GETLibraryItemsResponse

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('items')
      expect(data).toHaveProperty('nextCursor')
      expect(data.items).toBeArray()
      if (data.items.length > 0) {
        expect(data.items[0]).toHaveProperty('mangaId')
        expect(data.items[0]).toHaveProperty('createdAt')
      }
    })

    test.skip('cursor를 사용한 페이지네이션이 작동한다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const firstResponse = await createRequest(1)
      const firstData = (await firstResponse.json()) as GETLibraryItemsResponse

      if (firstData.nextCursor) {
        const secondResponse = await createRequest(1, firstData.nextCursor)
        const secondData = (await secondResponse.json()) as GETLibraryItemsResponse

        expect(secondResponse.status).toBe(200)
        expect(secondData.items).toBeArray()
        // 두 번째 페이지의 아이템이 첫 번째 페이지와 다른지 확인
        if (firstData.items.length > 0 && secondData.items.length > 0) {
          expect(secondData.items[0].mangaId).not.toBe(firstData.items[0].mangaId)
        }
      }
    })

    test('유효하지 않은 cursor를 사용하면 400 에러를 반환한다', async () => {
      const response = await createRequest(1, 'invalid-cursor')

      expect(response.status).toBe(400)
    })
  })

  describe('캐시 헤더', () => {
    test.skip('응답에 private 캐시 헤더가 포함되어 있다', async () => {
      // 실제 DB 연결이 필요한 테스트
      const response = await createRequest(1)

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })
})
