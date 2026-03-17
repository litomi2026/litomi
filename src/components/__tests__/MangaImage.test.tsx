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
    expect(image.getAttribute('src')).toBe('https://example.com/i/v2/manga/123/original/5')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_4.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_4.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://cdn.hentkor.net/pages/123/5.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('/image/fallback.svg')
  })

  test('첫 번째 썸네일은 queryless probe 뒤에 direct cover와 1페이지 원본 fallback을 순서대로 사용한다', () => {
    const { getByAltText } = render(<MangaImage imageIndex={0} kind="thumbnail" mangaId={123} />)
    const image = getByAltText('manga-image-1')

    expect(image.getAttribute('src')).toBe('https://example.com/i/v2/manga/123/thumbnail/1')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://cdn.imagedeliveries.com/123/thumbnails/cover.webp')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_0.avif')

    fireEvent.error(image)
    expect(image.getAttribute('src')).toBe('https://soujpa.in/start/123/123_0.webp')
  })
})
