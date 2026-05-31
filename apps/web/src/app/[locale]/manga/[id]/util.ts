import type { ImageWithVariants } from '@litomi/domain/manga/model'

import type { MangaImagePictures } from '@/components/MangaImage'

export function getResponsivePictureSources(image?: ImageWithVariants): MangaImagePictures[] {
  const originalSource = image?.original?.url

  if (!originalSource) {
    return []
  }

  return [
    {
      media: `(min-width: ${image?.thumbnail?.width ?? 0}px)`,
      src: originalSource,
      variant: 'original',
    },
  ]
}
