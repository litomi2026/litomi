import { describe, expect, test } from 'bun:test'

import { getAllCharactersWithLabels, translateCharacterList } from '../character'

describe('translateCharacterList', () => {
  test('알려진 캐릭터를 한국어로 번역한다', () => {
    expect(translateCharacterList(['aerith_gainsborough'], 'ko')).toEqual([
      { value: 'aerith_gainsborough', label: '에어리스 게인즈버러', links: undefined },
    ])
  })

  test('번역이 없으면 정규화된 값을 반환한다', () => {
    expect(translateCharacterList(['Some Random Character'], 'ko')).toEqual([
      { value: 'some_random_character', label: 'some random character', links: undefined },
    ])
  })
})

describe('getAllCharactersWithLabels', () => {
  test('카테고리 접두사가 붙은 한국어 라벨을 포함한다', () => {
    const items = getAllCharactersWithLabels()
    const aerith = items.find((item) => item.value === 'character:aerith_gainsborough')
    expect(aerith?.labels.ko).toBe('캐릭터:에어리스 게인즈버러')
  })
})
