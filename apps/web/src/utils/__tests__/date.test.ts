import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { formatDistanceToNow } from '@litomi/std'

describe('formatDistanceToNow', () => {
  const originalDateNow = Date.now
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
  const fixedNow = new Date('2026-03-29T12:00:00+09:00')

  beforeEach(() => {
    Date.now = () => fixedNow.getTime()
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      return {
        ...originalResolvedOptions.call(this),
        timeZone: 'Asia/Seoul',
      }
    }
  })

  afterEach(() => {
    Date.now = originalDateNow
    Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
  })

  test('3시간까지는 상대 시간으로 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-03-29T09:00:00+09:00'))).toBe('3시간 전')
  })

  test('같은 날 4시간 전부터는 시각으로 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-03-29T08:00:00+09:00'))).toBe('오전 8:00')
  })

  test('어제 날짜는 어제와 시각을 함께 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-03-28T23:49:00+09:00'))).toBe('어제 오후 11:49')
  })

  test('2일 전부터 6일 전까지는 요일과 시각을 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-03-27T08:39:00+09:00'))).toBe('(금) 오전 8:39')
  })

  test('30일 미만 날짜는 주 단위로 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-03-01T12:00:00+09:00'))).toBe('4주 전')
  })

  test('30일부터는 개월 수로 표시한다', () => {
    expect(formatDistanceToNow(new Date('2026-02-27T12:00:00+09:00'))).toBe('1개월 전')
  })

  test('11개월까지는 상대 개월 수를 표시한다', () => {
    expect(formatDistanceToNow(new Date('2025-04-29T12:00:00+09:00'))).toBe('11개월 전')
  })

  test('12개월부터는 절대 날짜 형식으로 전환한다', () => {
    const date = new Date('2025-03-29T12:00:00+09:00')

    expect(formatDistanceToNow(date)).toBe('2025-03-29 12:00')
  })
})
