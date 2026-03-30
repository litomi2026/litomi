import { describe, expect, test } from 'bun:test'

import { env } from '@/env/client'
import {
  createEquivalentMangaImageSourceURLs,
  createMangaImageProxyRequestURL,
  isImageProxySourceURLCompatibleWithRouteParams,
  isMangaImageProxyRequestURL,
  parseImageProxySourceURL,
} from '@/utils/image-proxy'

const proxyOrigin = new URL(env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN).origin

describe('만화 이미지 프록시 유틸', () => {
  test('프록시 요청 URL을 queryless /i/v2/manga/:mangaId/:variant/:page 형태로 만든다', () => {
    const requestURL = createMangaImageProxyRequestURL({
      mangaId: 123,
      page: 5,
      variant: 'original',
    })
    const parsedRequestURL = new URL(requestURL)

    expect(parsedRequestURL.origin).toBe(proxyOrigin)
    expect(parsedRequestURL.pathname).toBe('/i/v2/manga/123/original/5.webp')
    expect(parsedRequestURL.search).toBe('')
  })

  test('프록시 materialize URL을 같은 경로 + ?u=<url> 형태로 만든다', () => {
    const sourceURL = 'https://soujpa.in/start/123/123_4.avif'
    const requestURL = createMangaImageProxyRequestURL({
      sourceURL,
      mangaId: 123,
      page: 5,
      variant: 'original',
    })
    const parsedRequestURL = new URL(requestURL)

    expect(parsedRequestURL.origin).toBe(proxyOrigin)
    expect(parsedRequestURL.pathname).toBe('/i/v2/manga/123/original/5.webp')
    expect(parsedRequestURL.searchParams.get('u')).toBe(sourceURL)
  })

  test('프록시 요청 URL만 프록시 URL로 판별한다', () => {
    expect(isMangaImageProxyRequestURL('https://soujpa.in/start/123/123_4.avif')).toBe(false)
    expect(isMangaImageProxyRequestURL('/image/fallback.svg')).toBe(false)
    expect(
      isMangaImageProxyRequestURL('https://not-proxy.example.com/i/v2/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in'),
    ).toBe(false)
    expect(
      isMangaImageProxyRequestURL(`${proxyOrigin}/i/v2/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in`),
    ).toBe(true)
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

  test('thumbnail 1페이지는 cover.webp를 대표 원본으로 사용한다', () => {
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

  test('soujpa 원본 URL은 현재 mangaId/page 기준으로 의미상 일치해야 한다', () => {
    const sourceURL = parseImageProxySourceURL('https://soujpa.in/start/123/123_4.avif')

    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 123,
        page: 5,
        variant: 'original',
      }),
    ).toBe(true)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 124,
        page: 5,
        variant: 'original',
      }),
    ).toBe(false)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 123,
        page: 5,
        variant: 'thumbnail',
      }),
    ).toBe(true)
  })

  test('hentkor 루트 호스트 원본 URL은 mangaId/page가 맞아야 한다', () => {
    const sourceURL = parseImageProxySourceURL('https://hentkor.net/pages/777/9.avif')

    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 777,
        page: 9,
        variant: 'original',
      }),
    ).toBe(true)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 777,
        page: 10,
        variant: 'original',
      }),
    ).toBe(false)
  })

  test('cdn.hentkor.net 서브도메인은 아직 의미 검증 없이 허용한다', () => {
    const sourceURL = parseImageProxySourceURL('https://cdn.hentkor.net/pages/777/9.avif')

    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 777,
        page: 10,
        variant: 'original',
      }),
    ).toBe(true)
  })

  test('cdn.imagedeliveries 썸네일 URL은 thumbnail route와 맞아야 한다', () => {
    const numericThumbnailURL = parseImageProxySourceURL('https://cdn.imagedeliveries.com/456/thumbnails/3.webp')
    const coverThumbnailURL = parseImageProxySourceURL('https://cdn.imagedeliveries.com/456/thumbnails/cover.webp')

    expect(
      isImageProxySourceURLCompatibleWithRouteParams(numericThumbnailURL, {
        mangaId: 456,
        page: 3,
        variant: 'thumbnail',
      }),
    ).toBe(true)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(numericThumbnailURL, {
        mangaId: 456,
        page: 1,
        variant: 'thumbnail',
      }),
    ).toBe(false)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(coverThumbnailURL, {
        mangaId: 456,
        page: 1,
        variant: 'thumbnail',
      }),
    ).toBe(true)
    expect(
      isImageProxySourceURLCompatibleWithRouteParams(coverThumbnailURL, {
        mangaId: 456,
        page: 2,
        variant: 'thumbnail',
      }),
    ).toBe(false)
  })

  test('아직 의미 검증을 붙이지 않은 허용 호스트는 일단 통과시킨다', () => {
    const sourceURL = parseImageProxySourceURL(
      'https://storage-6-10.k-hentai.org/storage/f2/74/f2740688125f4d28e0f2bd891e721ce0b38df1be.webp',
    )

    expect(
      isImageProxySourceURLCompatibleWithRouteParams(sourceURL, {
        mangaId: 1,
        page: 1,
        variant: 'original',
      }),
    ).toBe(true)
  })
})
