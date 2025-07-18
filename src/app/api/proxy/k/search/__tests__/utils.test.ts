import { describe, expect, test } from 'bun:test'

import { Manga } from '@/types/manga'

import { filterMangasByExcludedFilters, parseExclusionFilters } from '../utils'

describe('parseExclusionFilters', () => {
  test('series 관련 값이 주어지면 시리즈 필터를 반환한다', () => {
    const query = '-series:test'
    const result = parseExclusionFilters(query)
    expect(result).toEqual([{ category: 'series', value: 'test' }])
  })

  test('artist 관련 값이 주어지면 작가 필터를 반환한다', () => {
    const query = '-artist:test'
    const result = parseExclusionFilters(query)
    expect(result).toEqual([{ category: 'artist', value: 'test' }])
  })

  test('group 관련 값이 주어지면 그룹 필터를 반환한다', () => {
    const query = '-group:test'
    const result = parseExclusionFilters(query)
    expect(result).toEqual([{ category: 'group', value: 'test' }])
  })

  test('language 관련 값이 주어지면 언어 필터를 반환한다', () => {
    const query = '-language:test'
    const result = parseExclusionFilters(query)
    expect(result).toEqual([{ category: 'language', value: 'test' }])
  })

  test('카테고리가 없는 값이 주어지면 카테고리 없이 필터를 반환한다', () => {
    const query = '-test'
    const result = parseExclusionFilters(query)
    expect(result).toEqual([{ category: '', value: 'test' }])
  })
})

describe('filterMangasByExcludedFilters', () => {
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
    language: 'english',
  }

  test('주어진 태그와 일치하는 망가를 제외한다', () => {
    const filters = [{ category: 'female', value: 'big breasts' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('카테고리가 없는 값이 주어지면 카테고리 없이 필터링한다', () => {
    const filters = [{ category: '', value: 'ai generated' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('시리즈 필터와 일치하는 망가를 제외한다', () => {
    const filters = [{ category: 'series', value: 'naruto' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('패러디 카테고리를 사용해도 시리즈 필터와 동일하게 동작한다', () => {
    const filters = [{ category: 'parody', value: 'naruto' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('작가 필터와 일치하는 망가를 제외한다', () => {
    const filters = [{ category: 'artist', value: 'test artist' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('그룹 필터와 일치하는 망가를 제외한다', () => {
    const filters = [{ category: 'group', value: 'test group' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('언어 필터와 일치하는 망가를 제외한다', () => {
    const filters = [{ category: 'language', value: 'english' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('필터와 일치하는 망가가 없으면 그대로 반환한다', () => {
    const filters = [{ category: 'artist', value: 'non_existent_artist' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(mockManga)
  })

  test('여러 필터가 주어졌을 때 필터와 하나라도 일치하는 망가는 제외한다', () => {
    const filters = [
      { category: 'artist', value: 'non_existent' },
      { category: 'series', value: 'naruto' },
    ]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
  })

  test('필터 조건에 언더바와 공백을 사용할 수 있다', () => {
    const filters = [{ category: 'artist', value: 'test_artist' }]
    const result = filterMangasByExcludedFilters([mockManga], filters)
    expect(result).toHaveLength(0)
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

    test('망가가 10000개 일 때 10ms 이내로 처리한다', () => {
      const filters = [
        { category: 'female', value: 'tag 5' },
        { category: 'male', value: 'tag 10' },
        { category: 'series', value: 'series 5' },
        { category: 'artist', value: 'artist 10' },
        { category: 'group', value: 'group 5' },
        { category: 'language', value: 'english' },
        { category: '', value: 'other tag 25' },
      ]

      const startTime = performance.now()
      const result = filterMangasByExcludedFilters(largeMangaList, filters)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.length).toBeLessThan(largeMangaList.length)
      expect(executionTime).toBeLessThan(10)
    })

    test('대량 필터 처리 시 20ms 이내로 처리한다', () => {
      const largeFilters: { category: string; value: string }[] = []

      for (let i = 0; i < 500; i++) {
        largeFilters.push({ category: i % 2 ? 'female' : 'male', value: `tag ${i}` })
      }

      for (let i = 0; i < 500; i++) {
        largeFilters.push({ category: 'series', value: `series ${i}` })
      }

      for (let i = 0; i < 500; i++) {
        largeFilters.push({ category: 'artist', value: `artist ${i}` })
      }

      for (let i = 0; i < 300; i++) {
        largeFilters.push({ category: 'group', value: `group ${i}` })
      }

      for (let i = 0; i < 200; i++) {
        largeFilters.push({ category: 'language', value: i % 2 ? 'english' : 'japanese' })
      }

      for (let i = 0; i < 100; i++) {
        largeFilters.push({ category: 'female', value: `tag ${i}` })
      }

      const startTime = performance.now()
      const result = filterMangasByExcludedFilters(largeMangaList, largeFilters)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.length).toBeLessThan(largeMangaList.length)
      expect(executionTime).toBeLessThan(20)
    })
  })
})
