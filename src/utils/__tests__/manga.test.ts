import { describe, expect, test } from 'bun:test'

import { getImageSource, getViewerLink } from '../manga'

describe('getImageSource', () => {
  test('CDN 별로 이미지 소스를 반환한다', () => {
    expect(getImageSource({ origin: 'https://thumb.k-hentai', imageURL: '/thumbnail.jpg' })).toBe(
      'https://thumb.k-hentai/thumbnail.jpg',
    )
    expect(getImageSource({ origin: undefined, imageURL: 'https://example.com/image.jpg' })).toBe(
      'https://example.com/image.jpg',
    )
  })
})

describe('getViewerLink', () => {
  test('소스 별로 뷰어 링크를 생성한다', () => {
    expect(getViewerLink(12345)).toBe('/manga/12345')
    expect(getViewerLink(67890)).toBe('/manga/67890')
    expect(getViewerLink(11111)).toBe('/manga/11111')
    expect(getViewerLink(99999)).toBe('/manga/99999')
  })
})
