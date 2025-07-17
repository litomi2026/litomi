import { describe, expect, test } from 'bun:test'

import { parseExclusionFilters } from '../utils'

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
