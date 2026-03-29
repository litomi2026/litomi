import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import dayjs from 'dayjs'

import { formatDistanceToNow } from '../format/date'

describe('formatDistanceToNow', () => {
  const originalDateNow = Date.now
  const fixedNow = new Date('2026-03-29T12:00:00+09:00')

  beforeEach(() => {
    Date.now = () => fixedNow.getTime()
  })

  afterEach(() => {
    Date.now = originalDateNow
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

    expect(formatDistanceToNow(date)).toBe(dayjs(date).format('YYYY-MM-DD HH:mm'))
  })
})
