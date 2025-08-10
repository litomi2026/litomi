import { describe, expect, it } from 'bun:test'

import { translateTag } from '../tag'

describe('tag-translations', () => {
  describe('translateTag', () => {
    it('should return complete translation when available in tag.json', () => {
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

    it('should fallback to English when Korean translation is not available', () => {
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

    it('should construct tag with translated parts when no complete translation exists', () => {
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

    it('should handle tags with no translations at all', () => {
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
