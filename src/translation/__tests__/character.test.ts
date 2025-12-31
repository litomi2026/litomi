import { describe, expect, test } from 'bun:test'

import { getAllCharactersWithLabels, translateCharacterList } from '../character'

describe('translateCharacterList', () => {
  test('should translate known character to Korean', () => {
    expect(translateCharacterList(['aerith_gainsborough'], 'ko')).toEqual([
      { value: 'aerith_gainsborough', label: '에어리스 게인즈버러', links: undefined },
    ])
  })

  test('should fallback to normalized value when no translation found', () => {
    expect(translateCharacterList(['Some Random Character'], 'ko')).toEqual([
      { value: 'some_random_character', label: 'some random character', links: undefined },
    ])
  })
})

describe('getAllCharactersWithLabels', () => {
  test('should include Korean label with category prefix', () => {
    const items = getAllCharactersWithLabels()
    const aerith = items.find((item) => item.value === 'character:aerith_gainsborough')
    expect(aerith?.labels.ko).toBe('캐릭터:에어리스 게인즈버러')
  })
})


