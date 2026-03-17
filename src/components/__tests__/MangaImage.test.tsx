import { fireEvent, render } from '@testing-library/react'
import { describe, expect, test } from 'bun:test'

import MangaImage from '../MangaImage'

describe('MangaImage fallback', () => {
  test('원본 이미지는 direct src 이후 queryless probe와 direct 원본 후보를 거쳐 로컬 fallback으로 내려간다', () => {
    const { getByAltText } = render(
      <MangaImage imageIndex={4} mangaId={123} src="https://origin.example.com/pages/123/5.avif" />,
    )
    const image = getByAltText('manga-image-5')

    expect(image.getAttribute('src')).toBe('https://origin.example.com/pages/123/5.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://example.com/i/v2/manga/123/original/5.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_4.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_4.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://cdn.hentkor.net/pages/123/5.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('/image/fallback.svg')
  })

  test('첫 번째 썸네일은 queryless probe 뒤에 해당 썸네일과 같은 페이지 원본 fallback을 순서대로 시도한다', () => {
    const { getByAltText } = render(<MangaImage imageIndex={0} mangaId={123} variant="thumbnail" />)
    const image = getByAltText('manga-image-1')

    expect(image.getAttribute('src')).toBe('https://example.com/i/v2/manga/123/thumbnail/1.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://cdn.imagedeliveries.com/123/thumbnails/cover.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_0.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_0.webp')
  })

  test('썸네일 fallback의 soujpa 원본 URL은 요청 page를 사용한다', () => {
    const { getByAltText } = render(<MangaImage imageIndex={2} mangaId={123} variant="thumbnail" />)
    const image = getByAltText('manga-image-3')

    expect(image.getAttribute('src')).toBe('https://example.com/i/v2/manga/123/thumbnail/3.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://cdn.imagedeliveries.com/123/thumbnails/3.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_2.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_2.webp')
  })
})
