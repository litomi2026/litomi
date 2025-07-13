import { ImgHTMLAttributes, memo } from 'react'

import { Manga } from '@/types/manga'
import { getImageSrc } from '@/utils/manga'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  manga: Manga
  imageIndex: number
  imageRef?: (node?: Element | null) => void
}

export default memo(MangaImage)

function MangaImage({ manga, imageIndex, imageRef, ...props }: Readonly<Props>) {
  const { images, cdn, id } = manga
  const imagePath = images[imageIndex]

  return (
    imagePath && (
      <img
        alt={`manga-image-${imageIndex + 1}`}
        draggable={false}
        fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
        ref={imageRef}
        referrerPolicy="same-origin"
        src={getImageSrc({ cdn, id, path: imagePath })}
        {...props}
      />
    )
  )
}
