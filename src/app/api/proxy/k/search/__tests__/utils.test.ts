import { describe, expect, test } from 'bun:test'

import { Manga } from '@/types/manga'

import { convertToKHentaiKey, filterMangasByMinusPrefix, parseMinusPrefixFilters } from '../utils'

describe('parseMinusPrefixFilters', () => {
  test('language 관련 값이 주어지면 언어 필터를 반환한다', () => {
    const query = '-language:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'language', value: 'test' }])
  })

  test('artist 관련 값이 주어지면 작가 필터를 반환한다', () => {
    const query = '-artist:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'artist', value: 'test' }])
  })

  test('group 관련 값이 주어지면 그룹 필터를 반환한다', () => {
    const query = '-group:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'group', value: 'test' }])
  })

  test('series 관련 값이 주어지면 시리즈 필터를 반환한다', () => {
    const query = '-series:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'series', value: 'test' }])
  })

  test('character 관련 값이 주어지면 캐릭터 필터를 반환한다', () => {
    const query = '-character:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'character', value: 'test' }])
  })

  test('female 관련 값이 주어지면 여성 필터를 반환한다', () => {
    const query = '-female:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'female', value: 'test' }])
  })

  test('male 관련 값이 주어지면 남성 필터를 반환한다', () => {
    const query = '-male:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'male', value: 'test' }])
  })

  test('mixed 관련 값이 주어지면 혼성 필터를 반환한다', () => {
    const query = '-mixed:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'mixed', value: 'test' }])
  })

  test('other 관련 값이 주어지면 기타 필터를 반환한다', () => {
    const query = '-other:test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([{ category: 'other', value: 'test' }])
  })

  test('카테고리가 없는 값이 주어지면 카테고리 없이 필터를 반환한다', () => {
    const query = '-test'
    const result = parseMinusPrefixFilters(query)
    expect(result).toEqual([])
  })

  describe('예외', () => {
    test('빈 문자열이 주어지면 빈 배열을 반환한다', () => {
      const query = ''
      const result = parseMinusPrefixFilters(query)
      expect(result).toEqual([])
    })

    test('언더바가 포함된 검색어를 처리한다', () => {
      const query = '-series:test_series'
      const result = parseMinusPrefixFilters(query)
      expect(result).toEqual([{ category: 'series', value: 'test_series' }])
    })

    test('대소문자를 구분하지 않는다', () => {
      const query = '-SeRiEs:TeSt'
      const result = parseMinusPrefixFilters(query)
      expect(result).toEqual([{ category: 'series', value: 'test' }])
    })
  })
})

describe('filterMangasByMinusPrefix', () => {
  const mockManga: Manga = {
    id: 1,
    title: 'Test Manga',
    images: [],
    tags: [
      { label: 'Big Breasts', value: 'big_breasts', category: 'female' },
      { label: 'AI Generated', value: 'ai_generated', category: 'other' },
    ],
    series: [{ label: 'Naruto', value: 'naruto' }],
    artists: [{ label: 'Test Artist', value: 'test_artist' }],
    group: [{ label: 'Test Group', value: 'test_group' }],
    languages: [{ label: 'English', value: 'english' }],
  }

  test('언어 필터와 일치하는 망가를 제외한다', () => {
    const query = '-language:english'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('작가 필터와 일치하는 망가를 제외한다', () => {
    const query = '-artist:test_artist'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('그룹 필터와 일치하는 망가를 제외한다', () => {
    const query = '-group:test_group'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('시리즈 필터와 일치하는 망가를 제외한다', () => {
    const query = '-series:naruto'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('여성 태그와 일치하는 망가를 제외한다', () => {
    const query = '-female:big_breasts'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('기타 태그와 일치하는 망가를 제외한다', () => {
    const query = '-other:ai_generated'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  test('여러 필터가 주어졌을 때 필터와 하나라도 일치하는 망가는 제외한다', () => {
    const query = '-artist:non_existent -series:naruto'
    const result = filterMangasByMinusPrefix([mockManga], query)
    expect(result).toHaveLength(0)
  })

  describe('예외', () => {
    test('카테고리가 없는 값이 주어지면 필터링하지 않는다', () => {
      const query = '-ai_generated'
      const result = filterMangasByMinusPrefix([mockManga], query)
      expect(result).toHaveLength(1)
    })

    test('허용되지 않는 카테고리가 주어지면 필터링하지 않는다', () => {
      const query = '-parody:naruto'
      const result = filterMangasByMinusPrefix([mockManga], query)
      expect(result).toHaveLength(1)
    })

    test('필터와 일치하는 망가가 없으면 그대로 반환한다', () => {
      const query = '-artist:non_existent_artist'
      const result = filterMangasByMinusPrefix([mockManga], query)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockManga)
    })

    test('필터 조건에 언더바와 공백을 사용할 수 있다', () => {
      const query = '-artist:test_artist'
      const result = filterMangasByMinusPrefix([mockManga], query)
      expect(result).toHaveLength(0)
    })
  })

  describe('성능', () => {
    const largeMangaList: Manga[] = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      title: `Manga ${i}`,
      images: [],
      tags: [
        { label: `Tag ${i % 500}`, value: `tag_${i % 500}`, category: i % 2 ? 'female' : 'male' },
        { label: `Special ${i % 100}`, value: `special_${i % 100}`, category: 'other' },
      ],
      series: [{ label: `Series ${i % 50}`, value: `series_${i % 50}` }],
      artists: [{ label: `Artist ${i % 200}`, value: `artist_${i % 200}` }],
      group: [{ label: `Group ${i % 30}`, value: `group_${i % 30}` }],
      language: i % 5 === 0 ? 'english' : 'japanese',
    }))

    test('10000개 망가를 30ms 이내로 필터링한다', () => {
      const query = [
        '-female:tag_5',
        '-male:tag_10',
        '-series:series_5',
        '-artist:artist_10',
        '-group:group_5',
        '-language:english',
        '-other:other_tag_25',
      ].join(' ')

      const startTime = performance.now()
      const result = filterMangasByMinusPrefix(largeMangaList, query)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.length).toBeLessThan(largeMangaList.length)
      expect(executionTime).toBeLessThan(30)
    })

    test('대량 필터를 30ms 이내로 처리한다', () => {
      const query = []

      for (let i = 0; i < 500; i++) {
        query.push(`-${i % 2 ? 'female' : 'male'}:tag_${i}`)
      }

      for (let i = 0; i < 500; i++) {
        query.push(`-series:series_${i}`)
      }

      for (let i = 0; i < 500; i++) {
        query.push(`-artist:artist_${i}`)
      }

      for (let i = 0; i < 300; i++) {
        query.push(`-group:group_${i}`)
      }

      for (let i = 0; i < 200; i++) {
        query.push(`-language:${i % 2 ? 'english' : 'japanese'}`)
      }

      for (let i = 0; i < 100; i++) {
        query.push(`-female:tag_${i}`)
      }

      const startTime = performance.now()
      const result = filterMangasByMinusPrefix(largeMangaList, query.join(' '))
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.length).toBeLessThan(largeMangaList.length)
      expect(executionTime).toBeLessThan(30)
    })
  })
})

describe('convertQueryKey', () => {
  test('id:12345 -> gid:12345', () => {
    const query = 'id:12345'
    const result = convertToKHentaiKey(query)
    expect(result).toBe('gid:12345')
  })

  test('series:naruto -> parody:naruto', () => {
    const query = 'series:naruto'
    const result = convertToKHentaiKey(query)
    expect(result).toBe('parody:naruto')
  })
})
