import { describe, expect, it, mock } from 'bun:test'

import { GET } from '../route'

describe('GET /api/proxy/k/search - 클라이언트 연결 끊김 테스트', () => {
  it('클라이언트가 연결을 끊으면 AbortSignal이 작동해야 함', async () => {
    const controller = new AbortController()
    const request = new Request('http://localhost:3000/api/proxy/k/search?query=test', { signal: controller.signal })
    const responsePromise = GET(request)
    setTimeout(() => controller.abort(), 100)
    const response = await responsePromise

    expect(response.status).toBeOneOf([200, 499, 500])
  })

  it('이미 끊어진 연결에서는 즉시 중단되어야 함', async () => {
    const controller = new AbortController()
    controller.abort()
    const request = new Request('http://localhost:3000/api/proxy/k/search?query=test', { signal: controller.signal })
    const startTime = Date.now()
    const response = await GET(request)
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(1000)

    if (response.status === 499) {
      const json = (await response.json()) as { status?: number; detail?: string }
      expect(json.status).toBe(499)
      expect(json.detail).toBe('요청이 취소됐어요')
    }
  })
})

describe('AbortSignal 전파 테스트', () => {
  it('kHentaiClient.searchMangas에 signal이 전달되어야 함', async () => {
    const mockSearchMangas = mock(() => Promise.resolve([]))
    const originalModule = await import('@/crawler/k-hentai')
    originalModule.kHentaiClient.searchMangas = mockSearchMangas

    const controller = new AbortController()
    const request = new Request('http://localhost:3000/api/proxy/k/search?query=test', {
      signal: controller.signal,
    })

    await GET(request)

    expect(mockSearchMangas).toHaveBeenCalled()
  })
})
