import { describe, expect, test } from 'bun:test'

import { imageURLSchema } from '../zod'

describe('database zod schemas', () => {
  describe('imageURLSchema', () => {
    test('http와 https URL을 허용한다', () => {
      expect(imageURLSchema.safeParse('https://example.com/profile.jpg').success).toBe(true)
      expect(imageURLSchema.safeParse('http://example.com/profile.jpg').success).toBe(true)
    })

    test('형식이 잘못된 URL은 형식 오류로 거부한다', () => {
      const result = imageURLSchema.safeParse('not-a-url')

      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues).toHaveLength(1)
        expect(result.error.issues[0]?.message).toBe('프로필 이미지 주소가 URL 형식이 아니에요')
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
          expect(result.error.issues[0]?.message).toBe('프로필 이미지 URL은 http 또는 https만 사용할 수 있어요')
        }
      }
    })
  })
})
