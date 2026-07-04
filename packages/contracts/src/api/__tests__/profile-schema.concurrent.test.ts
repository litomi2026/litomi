import { describe, expect, test } from 'bun:test'

import { imageURLSchema } from '../me'

describe('프로필 스키마', () => {
  describe('imageURLSchema', () => {
    test('http와 https URL을 허용한다', () => {
      expect(imageURLSchema.safeParse('https://example.com/profile.jpg').success).toBe(true)
      expect(imageURLSchema.safeParse('http://example.com/profile.jpg').success).toBe(true)
    })

    test('형식이 잘못된 URL은 형식 오류로 거부한다', () => {
      const result = imageURLSchema.safeParse('not-a-url')

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.code === 'invalid_format')).toBe(true)
      }
    })

    test('http/https 외 프로토콜은 거부한다', () => {
      const invalidURLs = [
        'javascript:alert(1)',
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        'ftp://example.com/profile.jpg',
      ]

      for (const invalidURL of invalidURLs) {
        const result = imageURLSchema.safeParse(invalidURL)

        expect(result.success).toBe(false)

        if (!result.success) {
          const issue = result.error.issues[0]
          expect(issue?.code).toBe('custom')
          expect(issue && 'params' in issue ? issue.params : undefined).toEqual({ code: 'invalid-protocol' })
        }
      }
    })
  })
})
