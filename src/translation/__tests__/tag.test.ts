import { describe, expect, it } from 'bun:test'

import { translateTag, translateTagCategory, translateTagValue } from '../tag'

describe('tag-translations', () => {
  describe('translateTag', () => {
    it('should return complete translation when available in tag.json', () => {
      expect(translateTag('female', 'bunny_girl', 'ko')).toBe('여:바니걸')
      expect(translateTag('male', 'horse_boy', 'ko')).toBe('남:말 소년')
      expect(translateTag('female', 'catgirl', 'ko')).toBe('여:캣걸')
      expect(translateTag('female', 'miko', 'ko')).toBe('여:무녀')
    })

    it('should fallback to English when Korean translation is not available', () => {
      expect(translateTag('female', 'bunny_girl', 'ja')).toBe('女:bunny girl')
      expect(translateTag('male', 'horse_boy', 'ja')).toBe('男:horse boy')
    })

    it('should construct tag with translated parts when no complete translation exists', () => {
      expect(translateTag('female', 'ahegao', 'ko')).toBe('여:아헤가오')
      expect(translateTag('male', 'yaoi', 'ko')).toBe('남:BL')
    })

    it('should handle tags with no translations at all', () => {
      expect(translateTag('female', 'nonexistent_tag', 'ko')).toBe('여:nonexistent tag')
      expect(translateTag('other', 'some_random_tag', 'ko')).toBe('기타:some random tag')
    })
  })

  describe('translateTagCategory', () => {
    it('should translate tag categories correctly', () => {
      expect(translateTagCategory('female', 'ko')).toBe('여')
      expect(translateTagCategory('male', 'ko')).toBe('남')
      expect(translateTagCategory('mixed', 'ko')).toBe('혼합')
      expect(translateTagCategory('other', 'ko')).toBe('기타')
    })

    it('should fallback to English for unsupported locales', () => {
      expect(translateTagCategory('female', 'zh-TW')).toBe('女')
      expect(translateTagCategory('male', 'zh-TW')).toBe('男')
    })

    it('should format unknown categories', () => {
      expect(translateTagCategory('unknown_category', 'ko')).toBe('unknown category')
    })
  })

  describe('translateTagValue', () => {
    it('should translate tag values from various translation files', () => {
      expect(translateTagValue('yaoi', 'ko')).toBe('BL')
      expect(translateTagValue('ahegao', 'ko')).toBe('아헤가오')
    })

    it('should normalize and format unknown values', () => {
      expect(translateTagValue('some_unknown_tag', 'ko')).toBe('some unknown tag')
    })
  })
})
