import { describe, expect, it } from 'bun:test'

import { NotificationConditionType } from '@/database/enum'

import { type ParsedCondition, parseSearchQuery } from '../queryParser'

describe('parseSearchQuery', () => {
  it('should parse simple tag queries', () => {
    const result = parseSearchQuery('female:big_breasts')

    expect(result.conditions).toHaveLength(1)
    expect(result.conditions[0]).toEqual({
      type: NotificationConditionType.TAG,
      value: 'big_breasts',
      displayValue: 'big_breasts',
    })
    expect(result.suggestedName).toBe('big_breasts')
  })

  it('should parse multiple conditions', () => {
    const result = parseSearchQuery('artist:john_doe female:glasses series:original')

    expect(result.conditions).toHaveLength(3)
    expect(result.conditions[0]).toEqual({
      type: NotificationConditionType.ARTIST,
      value: 'john_doe',
      displayValue: 'john_doe',
    })
    expect(result.conditions[1]).toEqual({
      type: NotificationConditionType.TAG,
      value: 'glasses',
      displayValue: 'glasses',
    })
    expect(result.conditions[2]).toEqual({
      type: NotificationConditionType.SERIES,
      value: 'original',
      displayValue: 'original',
    })
    expect(result.suggestedName).toBe('john_doe, original')
  })

  it('should handle mixed queries with plain keywords', () => {
    const result = parseSearchQuery('hello female:schoolgirl world')

    expect(result.conditions).toHaveLength(1)
    expect(result.plainKeywords).toEqual(['hello', 'world'])
    expect(result.suggestedName).toBe('schoolgirl')
  })

  it('should ignore minus prefixed conditions', () => {
    const result = parseSearchQuery('female:glasses -female:big_breasts artist:abc')

    expect(result.conditions).toHaveLength(2)
    expect(result.conditions.find((c) => c.value === 'big_breasts')).toBeUndefined()
  })

  it('should normalize values', () => {
    const result = parseSearchQuery('female:Big_Breasts')

    expect(result.conditions[0].value).toBe('big_breasts')
    expect(result.conditions[0].displayValue).toBe('Big_Breasts')
  })

  it('should handle empty query', () => {
    const result = parseSearchQuery('')

    expect(result.conditions).toHaveLength(0)
    expect(result.plainKeywords).toHaveLength(0)
    expect(result.suggestedName).toBe('')
  })

  it('should handle Korean search', () => {
    const result = parseSearchQuery('여성:안경 작가:홍길동')

    expect(result.conditions).toHaveLength(2)
    expect(result.conditions[0].type).toBe(NotificationConditionType.TAG)
    expect(result.conditions[1].type).toBe(NotificationConditionType.ARTIST)
    expect(result.suggestedName).toBe('홍길동')
  })
})
