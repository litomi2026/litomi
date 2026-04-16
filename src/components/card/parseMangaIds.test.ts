import { describe, expect, test } from 'bun:test'

import { parseMangaIds } from './parseMangaIds'

describe('parseMangaIds', () => {
  test('쉼표, 공백, 줄바꿈, 혼합 텍스트에서 숫자만 추출하고 중복은 첫 등장 순서대로 제거한다', () => {
    expect(
      parseMangaIds(`1234567
ignore 8879273
2345678, 3456789, 18827
8879273 and 1234567 again`),
    ).toEqual([1234567, 8879273, 2345678, 3456789, 18827])
  })
})
