import type { Manga } from '@/types/manga'

import { createThirdPartyMangaImageURLs } from './image-proxy'

const LOADING_MANGA_TITLE = '불러오는 중'

export function createLoadingManga(mangaId: number): Manga {
  return {
    id: mangaId,
    title: LOADING_MANGA_TITLE,
    images: createFirstPageThumbnailImages(mangaId),
  }
}

function createFirstPageThumbnailImages(mangaId: number): Manga['images'] {
  const thumbnailURL = createThirdPartyMangaImageURLs({
    mangaId,
    page: 1,
    variant: 'thumbnail',
  })[0]

  return [{ thumbnail: { url: thumbnailURL } }]
}
