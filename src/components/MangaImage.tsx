import { ImgHTMLAttributes, memo } from 'react'

import { Manga } from '@/types/manga'
import { getImageSource } from '@/utils/manga'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  manga: Manga
  imageIndex?: number
  imageRef?: (node?: Element | null) => void
}

export default memo(MangaImage)

function MangaImage({ manga, imageIndex = 0, imageRef, ...props }: Readonly<Props>) {
  const { images, origin } = manga
  const imageURL = images[imageIndex]

  return (
    imageURL && (
      <img
        alt={`manga-image-${imageIndex + 1}`}
        draggable={false}
        fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
        ref={imageRef}
        referrerPolicy="same-origin"
        src={getImageSource({ imageURL, origin })}
        {...props}
      />
    )
  )
}
