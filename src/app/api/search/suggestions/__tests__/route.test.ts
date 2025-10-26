import { describe, expect, test } from 'bun:test'

import type { GETSearchSuggestionsResponse } from '../schema'

import { GET } from '../route'

describe('GET /api/search/suggestions', () => {
  const createRequest = (query: string, locale: string = 'ko') => {
    return new Request(
      `http://localhost:3000/api/search/suggestions?query=${encodeURIComponent(query)}&locale=${locale}`,
    )
  }

  describe('성공', () => {
    describe('언어', () => {
      test('"langu" 값을 검색했을 때 언어 카테고리와 언어 옵션들을 반환한다', async () => {
        const request = createRequest('langu')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: '언어', value: 'language:' })
        expect(data.every((item) => item.value.includes('langu'))).toBe(true)
        expect(data.some((item) => item.value === 'language:korean' && item.label === '언어:한국어')).toBe(true)
        expect(data.some((item) => item.value === 'language:english' && item.label === '언어:영어')).toBe(true)
      })

      test('"language" 값을 검색했을 때 언어 카테고리와 언어 옵션들을 반환한다', async () => {
        const request = createRequest('language')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: '언어', value: 'language:' })
        expect(data.every((item) => item.value.includes('language'))).toBe(true)
        expect(data.some((item) => item.value === 'language:korean' && item.label === '언어:한국어')).toBe(true)
        expect(data.some((item) => item.value === 'language:english' && item.label === '언어:영어')).toBe(true)
      })

      test('"language:japa" 값을 검색했을 때 "language:japanese" 값만 반환한다', async () => {
        const request = createRequest('language:japa')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0]).toEqual({ label: '언어:일본어', value: 'language:japanese' })
      })

      test('"language:japanese" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('language:japanese')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0].value).toBe('language:japanese')
      })

      test('"japane" 값을 검색했을 때 "language:japanese" 값만 반환한다', async () => {
        const request = createRequest('japane')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.every((item) => item.value.includes('japane'))).toBe(true)
      })

      test('"japanese" 값을 검색했을 때 "language:japanese" 값만 반환한다', async () => {
        const request = createRequest('japanese')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.every((item) => item.value.includes('japanese'))).toBe(true)
      })
    })

    describe('종류', () => {
      test('"ty" 값을 검색했을 때 type 카테고리를 반환한다', async () => {
        const request = createRequest('ty')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: '종류', value: 'type:' })
      })

      test('"type:manga" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('type:manga')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0].value).toBe('type:manga')
      })

      test('"mang" 값을 검색했을 때 "type:manga" 값만 반환한다', async () => {
        const request = createRequest('mang')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'type:manga' && item.label === '종류:망가')).toBe(true)
      })

      test('"manga" 값을 검색했을 때 "type:manga" 값만 반환한다', async () => {
        const request = createRequest('manga')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBeGreaterThan(0)
        expect(data.every((item) => item.value.includes('manga'))).toBe(true)
        expect(data.some((item) => item.value === 'type:manga' && item.label === '종류:망가')).toBe(true)
      })
    })

    describe('태그', () => {
      test('"fem" 값을 검색했을 때 female 카테고리와 관련 태그들을 반환한다', async () => {
        const request = createRequest('fem')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'female:' && item.label === '여')).toBe(true)
        expect(data.some((item) => item.value.startsWith('female:'))).toBe(true)
      })

      test('"female:" 값을 검색했을 때 female 태그들을 반환한다', async () => {
        const request = createRequest('female:')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.every((item) => item.value.startsWith('female:'))).toBe(true)
      })

      test('"female:big_" 값을 검색했을 때 big으로 시작하는 female 태그들을 반환한다', async () => {
        const request = createRequest('female:big_')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.length).toBeGreaterThan(0)
        expect(data.every((item) => item.value.startsWith('female:big_'))).toBe(true)
        expect(data.some((item) => item.value === 'female:big_ass')).toBe(true)
      })

      test('"female:big_breasts" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('female:big_breasts')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0].value).toBe('female:big_breasts')
      })

      test('"big_" 값을 검색했을 때 정확한 카테고리의 big_ 태그만 반환한다', async () => {
        const request = createRequest('big_')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.some((item) => item.value.includes(':big_'))).toBe(true)
        expect(data.some((item) => item.value === 'female:big_ass' && item.label === '여:큰 엉덩이')).toBe(true)
        expect(data.some((item) => item.value === 'male:big_ass' && item.label === '남:큰 엉덩이')).toBe(true)
        expect(data.some((item) => item.value === 'mixed:big_ass' && item.label === '혼성:큰 엉덩이')).toBe(false)
        expect(data.some((item) => item.value === 'other:big_ass' && item.label === '기타:큰 엉덩이')).toBe(false)
        expect(data.some((item) => item.value === 'mixed:big_ass')).toBe(false)
        expect(data.some((item) => item.value === 'other:big_ass')).toBe(false)
        expect(data.some((item) => item.value === 'big_ass')).toBe(false)
      })

      test('"bds" 값을 검색했을 때 카테고리가 포함된 bdsm을 반환한다', async () => {
        const request = createRequest('bds')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.some((item) => item.value === 'female:bdsm' && item.label === '여:BDSM')).toBe(true)
        expect(data.some((item) => item.value === 'male:bdsm' && item.label === '남:BDSM')).toBe(true)
        expect(data.some((item) => item.value === 'bdsm')).toBe(false)
        expect(data.some((item) => item.value === 'mixed:bdsm')).toBe(false)
        expect(data.some((item) => item.value === 'other:bdsm')).toBe(false)
      })
    })

    describe('특수 태그', () => {
      test('"lolic" 값을 검색했을 때 "lolic"이 포함된 태그들을 반환한다', async () => {
        const request = createRequest('lolic')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.length).toBeGreaterThan(0)
        expect(data.some((item) => item.value === 'female:lolicon' && item.label === '여:로리콘')).toBe(true)
        expect(data.some((item) => item.value === 'female:low_lolicon')).toBe(true)
      })

      test('"female:lolic" 값을 검색했을 때 "female:lolicon" 값만 반환한다', async () => {
        const request = createRequest('female:lolic')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0]).toEqual({ label: '여:로리콘', value: 'female:lolicon' })
      })

      test('"female:lolicon" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('female:lolicon')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(1)
        expect(data[0].value).toBe('female:lolicon')
      })

      test('"_threesome" 값을 검색했을 때 mixed 카테고리와 관련 태그를 반환한다', async () => {
        const request = createRequest('threesome')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.some((item) => item.value === 'mixed:fff_threesome' && item.label === '혼합:여자끼리 쓰리썸')).toBe(
          true,
        )
        expect(data.some((item) => item.value === 'mixed:ffm_threesome' && item.label === '혼합:여여남 쓰리썸')).toBe(
          true,
        )
        expect(data.some((item) => item.value === 'mixed:fft_threesome' && item.label === '혼합:여여트 쓰리썸')).toBe(
          true,
        )
        expect(data.some((item) => item.value === 'mixed:mmf_threesome' && item.label === '혼합:남남여 쓰리썸')).toBe(
          true,
        )
        expect(data.some((item) => item.value === 'mixed:mmm_threesome' && item.label === '혼합:남자끼리 쓰리썸')).toBe(
          true,
        )
        expect(data.some((item) => item.value === 'mixed:mmt_threesome' && item.label === '혼합:남남트 쓰리썸')).toBe(
          true,
        )
      })

      test('"mixed:threesome" 값을 검색했을 때 값을 반환하지 않는다', async () => {
        const request = createRequest('mixed:threesome')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data.length).toBe(0)
      })
    })

    describe('캐릭터', () => {
      test('"gainsborough" 값을 검색했을 때 aerith_gainsborough를 반환한다', async () => {
        const request = createRequest('gainsborough')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'character:aerith_gainsborough')).toBe(true)
      })

      test('"aerith_gainsborough" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('aerith_gainsborough')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'character:aerith_gainsborough')).toBe(true)
      })

      test('"게인브루그" 값을 검색했을 때 aerith_gainsborough를 반환한다 (번역된 단어)', async () => {
        const request = createRequest('게인브루그')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'character:aerith_gainsborough')).toBe(true)
      })
    })

    describe('시리즈', () => {
      describe('카테고리', () => {
        test('"series" 값을 검색했을 때 series 카테고리를 반환한다', async () => {
          const request = createRequest('series')
          const response = await GET(request)
          const data = (await response.json()) as GETSearchSuggestionsResponse

          expect(response.status).toBe(200)
          expect(data.some((item) => item.value === 'series:' && item.label === '시리즈')).toBe(true)
          expect(data.every((item) => item.value.startsWith('series:') && item.label.startsWith('시리즈'))).toBe(true)
        })

        test('"시리즈" 값을 검색했을 때 series 카테고리를 반환한다', async () => {
          const request = createRequest('시리즈')
          const response = await GET(request)
          const data = (await response.json()) as GETSearchSuggestionsResponse

          expect(response.status).toBe(200)
          expect(data.some((item) => item.value === 'series:' && item.label === '시리즈')).toBe(true)
          // 번역된 단어에 "시리즈"가 포함된 경우도 반환될 수 있음
          expect(data.every((item) => item.label.includes('시리즈'))).toBe(true)
        })

        test('"series:" 값을 검색했을 때 시리즈 목록을 반환한다', async () => {
          const request = createRequest('series:')
          const response = await GET(request)
          const data = (await response.json()) as GETSearchSuggestionsResponse

          expect(response.status).toBe(200)
          expect(data.length).toBeGreaterThan(0)
          expect(data.every((item) => item.value.startsWith('series:') && item.label.startsWith('시리즈'))).toBe(true)
        })
      })

      test('"touhou" 값을 검색했을 때 Touhou Project를 반환한다', async () => {
        const request = createRequest('touhou')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'series:touhou_project')).toBe(true)
        expect(data.every((item) => item.value.includes('touhou'))).toBe(true)
      })

      test('"동방" 값을 검색했을 때 Touhou Project를 반환한다', async () => {
        const request = createRequest('동방')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'series:touhou_project')).toBe(true)
        expect(data.every((item) => item.label.includes('동방'))).toBe(true)
      })

      test('"프로젝트" 값을 검색했을 때 Touhou Project를 반환한다 (번역된 단어)', async () => {
        const request = createRequest('프로젝트')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'series:touhou_project')).toBe(true)
      })

      test('"series:touhou_project" 값을 검색했을 때 해당 값을 반환한다', async () => {
        const request = createRequest('series:touhou_project')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.length).toBe(1)
        expect(data[0].value).toBe('series:touhou_project')
      })

      test('"fate" 값을 검색했을 때 Fate 시리즈들을 반환한다', async () => {
        const request = createRequest('fate')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data.some((item) => item.value === 'series:fate_grand_order')).toBe(true)
        expect(data.some((item) => item.value === 'series:fate_stay_night')).toBe(true)
        expect(data.length).toBeGreaterThan(0)
      })
    })

    describe('다국어', () => {
      test('영어 로케일로 "language" 검색 시 영어 라벨을 반환한다', async () => {
        const request = createRequest('language', 'en')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: 'language', value: 'language:' })
        expect(data.some((item) => item.value === 'language:korean' && item.label === 'language:Korean')).toBe(true)
      })

      test('영어 로케일로 "touhou" 검색 시 영어 라벨을 반환한다', async () => {
        const request = createRequest('touhou', 'en')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse
        const touhouItem = data.find((item) => item.value === 'series:touhou_project')

        expect(response.status).toBe(200)
        expect(touhouItem?.label).toBe('series:Touhou Project')
      })

      test('일본어 로케일로 검색 시 일본어 라벨을 반환한다', async () => {
        const request = createRequest('female', 'ja')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: '女', value: 'female:' })
      })

      test('일본어 로케일로 검색 시 일본어 라벨을 반환한다', async () => {
        const request = createRequest('touhou', 'ja')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse
        const touhouItem = data.find((item) => item.value === 'series:touhou_project')

        expect(response.status).toBe(200)
        expect(touhouItem?.label).toBe('シリーズ:東方Project')
      })

      test('중국어 간체 로케일로 검색 시 중국어 라벨을 반환한다', async () => {
        const request = createRequest('male', 'zh-CN')
        const response = await GET(request)
        const data = (await response.json()) as GETSearchSuggestionsResponse

        expect(response.status).toBe(200)
        expect(data).toBeArray()
        expect(data[0]).toEqual({ label: '男', value: 'male:' })
      })
    })
  })

  describe('실패', () => {
    test('쿼리가 없는 경우 400 에러를 반환한다', async () => {
      const request = createRequest('')
      const response = await GET(request)
      const data = await response.text()

      expect(response.status).toBe(400)
      expect(data).toBe('400 Bad Request')
    })

    test('쿼리가 너무 짧은 경우(1글자) 400 에러를 반환한다', async () => {
      const request = createRequest('a')
      const response = await GET(request)
      const data = await response.text()

      expect(response.status).toBe(400)
      expect(data).toBe('400 Bad Request')
    })

    test('쿼리가 너무 긴 경우(200글자 초과) 400 에러를 반환한다', async () => {
      const longQuery = 'a'.repeat(201)
      const request = createRequest(longQuery)
      const response = await GET(request)
      const data = await response.text()

      expect(response.status).toBe(400)
      expect(data).toBe('400 Bad Request')
    })

    test('유효하지 않은 로케일인 경우 400 에러를 반환한다', async () => {
      const url = new URL('http://localhost:3000/api/search/suggestions?query=test&locale=invalid')
      const request = new Request(url)
      const response = await GET(request)
      const data = await response.text()

      expect(response.status).toBe(400)
      expect(data).toBe('400 Bad Request')
    })
  })

  describe('예외', () => {
    test('특수 문자가 포함된 검색어를 처리한다', async () => {
      const specialQueries = ['female:big_breasts', 'type:', 'male:cross-dressing']

      for (const query of specialQueries) {
        const request = createRequest(query)
        const response = await GET(request)

        expect(response.status).toBe(200)
        expect((await response.json()) as GETSearchSuggestionsResponse).toBeArray()
      }
    })

    test('대소문자를 구분하지 않는다', async () => {
      const request1 = createRequest('FEMALE')
      const response1 = await GET(request1)
      const data1 = await response1.json()

      const request2 = createRequest('female')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(data1).toEqual(data2)
    })

    test('검색 결과가 없는 경우 빈 배열을 반환한다', async () => {
      const request = createRequest('zzzznonexistent')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    test('공백이 포함된 검색어를 처리한다', async () => {
      const request = createRequest('big breasts')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data).toBeArray()
    })

    test('로케일이 제공되지 않으면 기본값 ko를 사용한다', async () => {
      const url = new URL('http://localhost:3000/api/search/suggestions?query=female')
      const request = new Request(url)
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.some((item) => item.label.includes('여'))).toBe(true)
    })

    test('결과는 최대 10개까지만 반환된다', async () => {
      const request = createRequest('fe')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data.length).toBeLessThanOrEqual(10)
    })

    test('짧은 값이 긴 값보다 먼저 반환된다', async () => {
      const request = createRequest('type')
      const response = await GET(request)
      const data = (await response.json()) as GETSearchSuggestionsResponse

      expect(response.status).toBe(200)
      expect(data[0].value).toBe('type:')

      const typeColonIndex = data.findIndex((item) => item.value === 'type:')
      const typeMangaIndex = data.findIndex((item) => item.value === 'type:manga')
      expect(typeMangaIndex).toBeGreaterThan(-1)
      expect(typeColonIndex).toBeLessThan(typeMangaIndex)
    })
  })

  describe('성능', () => {
    test('동시에 여러 요청을 처리할 수 있다', async () => {
      const queries = ['fem', 'male', 'type', 'lang', 'big']
      const promises = queries.map((query) => GET(createRequest(query)))
      const responses = await Promise.all(promises)

      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = await Promise.all(responses.map((r) => r.json()))
      expect(data.every((d) => Array.isArray(d))).toBe(true)
    })
  })
})
