import { describe, expect, test } from 'bun:test'

import { normalizeName } from '../common'

describe('normalizeName', () => {
  test('알파벳을 모두 소문자로 변환하고 공백을 언더스코어로 변환한다', () => {
    expect(normalizeName('Pokemon')).toBe('pokemon')
    expect(normalizeName('Touhou Project')).toBe('touhou_project')
    expect(normalizeName('FATE GRAND ORDER')).toBe('fate_grand_order')
    expect(normalizeName('Love Live')).toBe('love_live')
  })

  test('공백을 제거한다', () => {
    expect(normalizeName('  Pokemon  ')).toBe('pokemon')
  })
})
