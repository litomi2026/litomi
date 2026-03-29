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

  test('shows weeks for dates under 30 days old', () => {
    expect(formatDistanceToNow(new Date('2026-03-01T12:00:00+09:00'))).toBe('4주 전')
  })

  test('shows months starting at 30 days', () => {
    expect(formatDistanceToNow(new Date('2026-02-27T12:00:00+09:00'))).toBe('1개월 전')
  })

  test('shows relative months up to 11 months', () => {
    expect(formatDistanceToNow(new Date('2025-04-29T12:00:00+09:00'))).toBe('11개월 전')
  })

  test('falls back to absolute date at 12 months', () => {
    const date = new Date('2025-03-29T12:00:00+09:00')

    expect(formatDistanceToNow(date)).toBe(dayjs(date).format('YYYY-MM-DD HH:mm'))
  })
})
