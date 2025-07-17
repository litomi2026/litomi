import { describe, expect, test } from 'bun:test'

import type { GETSearchSuggestionsResponse } from '../schema'

import { GET } from '../route'

describe('GET /api/search/suggestions - Series', () => {
  const createRequest = (query: string, locale: string = 'ko') => {
    return new Request(
      `http://localhost:3000/api/search/suggestions?query=${encodeURIComponent(query)}&locale=${locale}`,
    )
  }

  describe('시리즈 카테고리', () => {
    test('"series" 값을 검색했을 때 series 카테고리를 반환한다', async () => {
      const request = createRequest('series')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.some((item) => item.value === 'series:' && item.label === '시리즈:')).toBe(true)
    })

    test('"시리즈" 값을 검색했을 때 series 카테고리를 반환한다', async () => {
      const request = createRequest('시리즈')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.some((item) => item.value === 'series:' && item.label === '시리즈:')).toBe(true)
    })

    test('"series:" 값을 검색했을 때 시리즈 목록을 반환한다', async () => {
      const request = createRequest('series:')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.length).toBeGreaterThan(0)
      expect(data.every((item) => item.value.startsWith('series:'))).toBe(true)
    })
  })

  describe('시리즈 검색', () => {
    test('"touhou" 값을 검색했을 때 Touhou Project를 반환한다', async () => {
      const request = createRequest('touhou')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse
      console.log('👀 - test - data:', data)

      expect(response.status).toBe(200)
      expect(data.some((item) => item.value === 'series:touhou_project' && item.label === '시리즈:동방 프로젝트')).toBe(
        true,
      )
    })

    test('"동방" 값을 검색했을 때 Touhou Project를 반환한다', async () => {
      const request = createRequest('동방')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse
      console.log('👀 - test - data:', data)

      expect(response.status).toBe(200)
      expect(data.some((item) => item.value === 'series:touhou_project' && item.label === '시리즈:동방 프로젝트')).toBe(
        true,
      )
    })

    test('"series:touhou_project" 값을 검색했을 때 값을 반환하지 않는다', async () => {
      const request = createRequest('series:touhou_project')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.length).toBe(0)
    })

    test('"fate" 값을 검색했을 때 Fate 시리즈들을 반환한다', async () => {
      const request = createRequest('fate')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.some((item) => item.value === 'series:fate_grand_order')).toBe(true)
      expect(data.some((item) => item.value === 'series:fate_stay_night')).toBe(true)
    })
  })

  describe('다국어 지원', () => {
    test('영어 로케일로 검색 시 영어 라벨을 반환한다', async () => {
      const request = createRequest('touhou', 'en')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      const touhouItem = data.find((item) => item.value === 'series:touhou_project')
      expect(touhouItem?.label).toBe('series:Touhou Project')
    })

    test('일본어 로케일로 검색 시 일본어 라벨을 반환한다', async () => {
      const request = createRequest('touhou', 'ja')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      const touhouItem = data.find((item) => item.value === 'series:touhou_project')
      expect(touhouItem?.label).toBe('シリーズ:東方Project')
    })
  })
})
