import { ImgHTMLAttributes, memo } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  imageIndex?: number
  imageRef?: (node?: Element | null) => void
}

export default memo(MangaImage)

function MangaImage({ imageIndex = 0, imageRef, ...props }: Readonly<Props>) {
  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      draggable={false}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      ref={imageRef}
      {...props}
    />
  )
}
