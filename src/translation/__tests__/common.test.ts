import { describe, expect, test } from 'bun:test'

import { normalizeValue } from '../common'

describe('normalizeValue', () => {
  test('알파벳을 모두 소문자로 변환하고 공백을 언더스코어로 변환한다', () => {
    expect(normalizeValue('Pokemon')).toBe('pokemon')
    expect(normalizeValue('Touhou Project')).toBe('touhou_project')
    expect(normalizeValue('FATE GRAND ORDER')).toBe('fate_grand_order')
    expect(normalizeValue('Love Live')).toBe('love_live')
  })

  test('공백을 제거한다', () => {
    expect(normalizeValue('  Pokemon  ')).toBe('pokemon')
  })
})
