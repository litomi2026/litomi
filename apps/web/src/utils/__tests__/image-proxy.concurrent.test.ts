import { env } from '@litomi/env/client'
import {
  createLitomiProxyMangaImageURL,
  createThirdPartyMangaImageURLs,
  isLitomiImageProxyURL,
} from '@litomi/http/image-proxy'
import { describe, expect, test } from 'bun:test'

const proxyOrigin = new URL(env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN).origin

describe('만화 이미지 프록시 유틸', () => {
  test('프록시 요청 URL을 queryless /i/v2/manga/:mangaId/:variant/:page 형태로 만든다', () => {
    const requestURL = createLitomiProxyMangaImageURL({
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
    const requestURL = createLitomiProxyMangaImageURL({
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
    expect(isLitomiImageProxyURL('https://soujpa.in/start/123/123_4.avif')).toBe(false)
    expect(isLitomiImageProxyURL('/image/fallback.svg')).toBe(false)
    expect(
      isLitomiImageProxyURL('https://not-proxy.example.com/i/v2/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in'),
    ).toBe(false)
    expect(isLitomiImageProxyURL(`${proxyOrigin}/i/v2/manga/123/original/5.webp?u=https%3A%2F%2Fsoujpa.in`)).toBe(true)
  })

  test('1-based 페이지 번호로 동등 원본 fallback 소스를 만든다', () => {
    expect(
      createThirdPartyMangaImageURLs({
        mangaId: 123,
        page: 5,
        variant: 'original',
      }),
    ).toEqual([
      'https://soujpa.in/start/123/123_4.avif',
      'https://soujpa.in/start/123/123_4.webp',
      'https://cdn.hentkor.net/pages/123/5.avif',
      'https://zrocdn.xyz/galleries/123/5.jpg',
    ])
  })

  test('썸네일 공유 캐시 후보에는 cover.webp를 포함하지 않는다', () => {
    expect(
      createThirdPartyMangaImageURLs({
        mangaId: 456,
        page: 3,
        variant: 'thumbnail',
      }),
    ).toEqual(['https://cdn.imagedeliveries.com/456/thumbnails/3.webp'])
  })

  test('thumbnail 1페이지는 k-hentai 썸네일 다음 cover.webp를 사용한다', () => {
    expect(
      createThirdPartyMangaImageURLs({
        mangaId: 456,
        page: 1,
        variant: 'thumbnail',
      }),
    ).toEqual([
      'https://khentai-t.siam-cdn.net/0/0/456',
      'https://cdn.imagedeliveries.com/456/thumbnails/cover.webp',
    ])
  })
})
