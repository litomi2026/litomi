import { describe, expect, it } from 'bun:test'

import { translateTag } from '../tag'

describe('태그 번역', () => {
  describe('translateTag', () => {
    it('tag.json에 완전한 번역이 있으면 그대로 반환한다', () => {
      expect(translateTag('female', 'bunny_girl', 'ko')).toEqual({
        category: 'female',
        value: 'bunny_girl',
        label: '여:바니걸',
      })
      expect(translateTag('male', 'horse_boy', 'ko')).toEqual({
        category: 'male',
        value: 'horse_boy',
        label: '남:말 소년',
      })
      expect(translateTag('female', 'catgirl', 'ko')).toEqual({
        category: 'female',
        value: 'catgirl',
        label: '여:캣걸',
      })
    })

    it('한국어 번역이 없으면 영어로 대체한다', () => {
      expect(translateTag('female', 'bunny_girl', 'ja')).toEqual({
        category: 'female',
        value: 'bunny_girl',
        label: '女:bunny girl',
      })
      expect(translateTag('male', 'horse_boy', 'ja')).toEqual({
        category: 'male',
        value: 'horse_boy',
        label: '男:horse boy',
      })
    })

    it('완전한 번역이 없으면 번역 가능한 조각을 조합해 태그를 만든다', () => {
      expect(translateTag('female', 'ahegao', 'ko')).toEqual({
        category: 'female',
        value: 'ahegao',
        label: '여:아헤가오',
      })
      expect(translateTag('male', 'yaoi', 'ko')).toEqual({
        category: 'male',
        value: 'yaoi',
        label: '남:BL',
      })
    })

    it('번역이 전혀 없는 태그도 처리한다', () => {
      expect(translateTag('female', 'nonexistent_tag', 'ko')).toEqual({
        category: 'female',
        value: 'nonexistent_tag',
        label: '여:nonexistent_tag',
      })
      expect(translateTag('other', 'some_random_tag', 'ko')).toEqual({
        category: 'other',
        value: 'some_random_tag',
        label: '기타:some_random_tag',
      })
    })
  })
})
