import { describe, expect, test } from 'bun:test'

import {
  createEquivalentMangaImageSourceURLs,
  createMangaImageProxyRequestURL,
  parseImageProxySourceURL,
} from '@/utils/image-proxy'

describe('manga image proxy utilities', () => {
  test('프록시 요청 URL을 queryless /i/v2/manga/:mangaId/:variant/:page 형태로 만든다', () => {
    const requestURL = createMangaImageProxyRequestURL({
      proxyOrigin: 'https://img.litomi.in',
      mangaId: 123,
      page: 5,
      variant: 'original',
    })
    const parsedRequestURL = new URL(requestURL)

    expect(parsedRequestURL.origin).toBe('https://img.litomi.in')
    expect(parsedRequestURL.pathname).toBe('/i/v2/manga/123/original/5')
    expect(parsedRequestURL.search).toBe('')
  })

  test('프록시 materialize URL을 같은 path + ?u=<url> 형태로 만든다', () => {
    const sourceURL = 'https://soujpa.in/start/123/123_4.avif'
    const requestURL = createMangaImageProxyRequestURL({
      proxyOrigin: 'https://img.litomi.in',
      sourceURL,
      mangaId: 123,
      page: 5,
      variant: 'original',
    })
    const parsedRequestURL = new URL(requestURL)

    expect(parsedRequestURL.origin).toBe('https://img.litomi.in')
    expect(parsedRequestURL.pathname).toBe('/i/v2/manga/123/original/5')
    expect(parsedRequestURL.searchParams.get('u')).toBe(sourceURL)
  })

  test('1-based 페이지 번호로 동등 원본 fallback 소스를 만든다', () => {
    expect(
      createEquivalentMangaImageSourceURLs({
        mangaId: 123,
        page: 5,
        variant: 'original',
      }),
    ).toEqual([
      'https://soujpa.in/start/123/123_4.avif',
      'https://soujpa.in/start/123/123_4.webp',
      'https://cdn.hentkor.net/pages/123/5.avif',
    ])
  })

  test('썸네일 공유 캐시 후보에는 cover.webp를 포함하지 않는다', () => {
    expect(
      createEquivalentMangaImageSourceURLs({
        mangaId: 456,
        page: 3,
        variant: 'thumbnail',
      }),
    ).toEqual(['https://cdn.imagedeliveries.com/456/thumbnails/3.webp'])
  })

  test('thumbnail 1페이지는 cover.webp를 canonical source로 사용한다', () => {
    expect(
      createEquivalentMangaImageSourceURLs({
        mangaId: 456,
        page: 1,
        variant: 'thumbnail',
      }),
    ).toEqual(['https://cdn.imagedeliveries.com/456/thumbnails/cover.webp'])
  })

  test('허용된 이미지 호스트 URL을 파싱한다', () => {
    expect(parseImageProxySourceURL('https://soujpa.in/start/123/123_4.avif?token=abc').toString()).toBe(
      'https://soujpa.in/start/123/123_4.avif?token=abc',
    )
    expect(
      parseImageProxySourceURL(
        'https://storage-6-10.k-hentai.org/storage/f2/74/f2740688125f4d28e0f2bd891e721ce0b38df1be.webp?md5=-D49G6esslygdj4fpHhAAw&expires=1773791999',
      ).toString(),
    ).toBe(
      'https://storage-6-10.k-hentai.org/storage/f2/74/f2740688125f4d28e0f2bd891e721ce0b38df1be.webp?md5=-D49G6esslygdj4fpHhAAw&expires=1773791999',
    )
    expect(() => parseImageProxySourceURL('https://evil.example.com/images/123.webp')).toThrow(
      '허용되지 않은 이미지 호스트예요',
    )
  })
})
