import { describe, expect, test } from 'bun:test'

import { getImageSrc, getViewerLink } from '../manga'
import { SourceParam } from '../param'

describe('manga.ts', () => {
  describe('getImageSrc', () => {
    test('CDN 별로 이미지 소스를 반환한다', () => {
      expect(getImageSrc({ cdn: 'HARPI', path: 'test/image.jpg' })).toMatch(/test\/image.jpg$/)
      expect(getImageSrc({ cdn: 'thumb.k-hentai', path: 'thumbnail.jpg' })).toMatch(/thumbnail.jpg$/)
      expect(getImageSrc({ cdn: undefined, path: 'default.jpg' })).toBe('default.jpg')

      expect(getImageSrc({ cdn: 'ehgt.org', path: 'https://example.com/image.jpg' })).toBe(
        'https://example.com/image.jpg',
      )

      expect(getImageSrc({ cdn: 'k-hentai', path: 'https://k-hentai.com/image.jpg' })).toBe(
        'https://k-hentai.com/image.jpg',
      )
    })
  })

  describe('getViewerLink', () => {
    test('소스 별로 뷰어 링크를 생성한다', () => {
      expect(getViewerLink(12345, SourceParam.HARPI)).toBe('/manga/12345/hp')
      expect(getViewerLink(67890, SourceParam.K_HENTAI)).toBe('/manga/67890/k')
      expect(getViewerLink(11111, SourceParam.HIYOBI)).toBe('/manga/11111/hi')
      expect(getViewerLink(99999, SourceParam.HITOMI)).toBe('/manga/99999/h')
    })
  })
})
