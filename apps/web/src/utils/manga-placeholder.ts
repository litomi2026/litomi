import type { Manga } from '@litomi/domain/manga/model'

import { createThirdPartyMangaImageURLs } from '@litomi/http/image-proxy'

import { MAX_THUMBNAIL_IMAGES } from '@/ui-policy'

const LOADING_MANGA_TITLE = '불러오는 중'

export function createLoadingManga(mangaId: number): Manga {
  return {
    id: mangaId,
    title: LOADING_MANGA_TITLE,
    images: createThumbnailImages(mangaId),
  }
}

function createThumbnailImages(mangaId: number): Manga['images'] {
  return Array.from({ length: MAX_THUMBNAIL_IMAGES }, (_, index) => {
    const page = index + 1
    const thumbnailURL = createThirdPartyMangaImageURLs({
      mangaId,
      page,
      variant: 'thumbnail',
    })[0]

    return { thumbnail: { url: thumbnailURL } }
  })
}
