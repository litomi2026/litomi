import { describe, expect, it } from 'bun:test'

import { NotificationConditionType } from '@/database/enum'

import { parseSearchQuery } from '../queryParser'

describe('parseSearchQuery', () => {
  it('단순한 태그 쿼리를 파싱한다', () => {
    const result = parseSearchQuery('female:big_breasts')

    expect(result.conditions).toHaveLength(1)
    expect(result.conditions[0]).toEqual({
      type: NotificationConditionType.TAG,
      value: 'big_breasts',
      displayValue: 'big_breasts',
      isExcluded: undefined,
    })
    expect(result.suggestedName).toBe('big_breasts')
  })

  it('여러 조건을 파싱한다', () => {
    const result = parseSearchQuery('artist:john_doe female:glasses series:original')

    expect(result.conditions).toHaveLength(3)
    expect(result.conditions[0]).toEqual({
      type: NotificationConditionType.ARTIST,
      value: 'john_doe',
      displayValue: 'john_doe',
      isExcluded: undefined,
    })
    expect(result.conditions[1]).toEqual({
      type: NotificationConditionType.TAG,
      value: 'glasses',
      displayValue: 'glasses',
      isExcluded: undefined,
    })
    expect(result.conditions[2]).toEqual({
      type: NotificationConditionType.SERIES,
      value: 'original',
      displayValue: 'original',
      isExcluded: undefined,
    })
    expect(result.suggestedName).toBe('john_doe, original')
  })

  it('일반 키워드가 섞인 쿼리를 처리한다', () => {
    const result = parseSearchQuery('hello female:schoolgirl world')

    expect(result.conditions).toHaveLength(1)
    expect(result.plainKeywords).toEqual(['hello', 'world'])
    expect(result.suggestedName).toBe('schoolgirl')
  })

  it('마이너스 접두사가 붙은 조건을 제외 조건으로 유지한다', () => {
    const result = parseSearchQuery('female:glasses -female:big_breasts artist:abc')

    expect(result.conditions).toHaveLength(3)
    expect(result.conditions.find((c) => c.value === 'big_breasts')).toEqual({
      type: NotificationConditionType.TAG,
      value: 'big_breasts',
      displayValue: 'big_breasts',
      isExcluded: true,
    })
  })

  it('구조화된 조건이 전부 제외 조건일 때는 일반 키워드로 추천 이름을 만든다', () => {
    const result = parseSearchQuery('hello -female:big_breasts')

    expect(result.conditions).toEqual([
      {
        type: NotificationConditionType.TAG,
        value: 'big_breasts',
        displayValue: 'big_breasts',
        isExcluded: true,
      },
    ])
    expect(result.plainKeywords).toEqual(['hello'])
    expect(result.suggestedName).toBe('hello')
  })

  it('추천 이름을 만들 일반 키워드가 없으면 제외 조건으로 대체한다', () => {
    const result = parseSearchQuery('-female:big_breasts -artist:abc')

    expect(result.suggestedName).toBe('-big_breasts, -abc')
  })

  it('값을 정규화한다', () => {
    const result = parseSearchQuery('female:Big_Breasts')

    expect(result.conditions[0].value).toBe('big_breasts')
    expect(result.conditions[0].displayValue).toBe('Big_Breasts')
  })

  it('빈 쿼리를 처리한다', () => {
    const result = parseSearchQuery('')

    expect(result.conditions).toHaveLength(0)
    expect(result.plainKeywords).toHaveLength(0)
    expect(result.suggestedName).toBe('')
  })

  it('한국어 검색어를 처리한다', () => {
    const result = parseSearchQuery('여성:안경 작가:홍길동')

    expect(result.conditions).toHaveLength(2)
    expect(result.conditions[0].type).toBe(NotificationConditionType.TAG)
    expect(result.conditions[1].type).toBe(NotificationConditionType.ARTIST)
    expect(result.suggestedName).toBe('홍길동')
  })
})
