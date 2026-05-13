import type { ImageVariant, ImageWithVariants, Manga } from '@/types/manga'

import type { ReaderPageBase } from './ImageViewer/readerPages'

export type MangaReaderPage = MangaImageReaderPage | MangaLastReaderPage

type MangaImageReaderPage = ReaderPageBase & {
  image: ImageWithVariants
  imageIndex: number
  kind: 'image'
  thumbnail?: ImageVariant
}

type MangaLastReaderPage = ReaderPageBase & {
  kind: 'last'
}

export function createMangaReaderPages(manga: Manga): MangaReaderPage[] {
  const { images = [] } = manga

  if (images.length === 0) {
    return []
  }

  return [
    ...images.map((image, imageIndex): MangaImageReaderPage => {
      const pageNumber = imageIndex + 1

      return {
        id: `image:${pageNumber}`,
        image,
        imageIndex,
        kind: 'image',
        progressMode: 'count',
        spreadMode: 'pairable',
        thumbnail: image.thumbnail,
      }
    }),
    {
      id: 'last',
      kind: 'last',
      progressMode: 'skip',
      spreadMode: 'solo',
    },
  ]
}
